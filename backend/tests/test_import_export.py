import json

from schemas.coin import CoinCreate

URL = "/api/v1/coins/import"


def _post(client, headers, name, content, ctype="text/csv"):
    return client.post(URL, headers=headers, files={"file": (name, content, ctype)})


def test_import_csv_semicolon_with_bom(client, auth_headers):
    csv = "﻿title;year;country;face_value;purchase_price\n1 Real;1994;Brasil;1 Real;10,50\n".encode("utf-8")
    r = _post(client, auth_headers, "c.csv", csv)
    assert r.json() == {"inserted": 1, "errors": []}
    got = client.get("/api/v1/coins", headers=auth_headers).json()["data"][0]
    assert got["purchase_price"] == 10.5


def test_import_reports_bad_rows(client, auth_headers):
    csv = b"title,year,country,face_value\nok,1994,Brasil,1\nbad,abc,Brasil,1\n"
    r = _post(client, auth_headers, "c.csv", csv)
    assert r.json()["inserted"] == 1
    err = r.json()["errors"][0]
    assert err["row"] == 2 and err["message"]


def test_import_empty_cells_become_none(client, auth_headers):
    csv = b"title;year;country;face_value;notes;sale_price\nx;1994;Brasil;1;;\n"
    assert _post(client, auth_headers, "c.csv", csv).json() == {"inserted": 1, "errors": []}


def test_import_json_row_errors(client, auth_headers):
    good = {"title": "a", "year": 1994, "country": "BR", "face_value": "1"}
    data = json.dumps([good, {"title": "b"}]).encode()
    r = _post(client, auth_headers, "c.json", data, "application/json")
    assert r.json()["inserted"] == 1
    assert r.json()["errors"][0]["row"] == 2


def test_import_bad_extension_400(client, auth_headers):
    assert _post(client, auth_headers, "c.txt", b"x").status_code == 400


def test_import_undecodable_400(client, auth_headers):
    r = _post(client, auth_headers, "c.csv", b"\xff\xfe\x00\x81\x82")
    assert r.status_code == 400


def test_export_roundtrip(client, auth_headers, make_coin):
    make_coin(title="Réis", catalog_ref="KM# 1", for_sale=True, sale_price=12.5)
    r = client.get("/api/v1/coins/export/all", params={"format": "csv"}, headers=auth_headers)
    assert r.content.startswith(b"\xef\xbb\xbf")
    assert "colecao-" in r.headers["content-disposition"]
    assert ";" in r.content.decode("utf-8-sig").splitlines()[0]
    out = _post(client, auth_headers, "e.csv", r.content).json()
    assert out == {"inserted": 1, "errors": []}


def test_export_json_disposition(client, auth_headers):
    r = client.get("/api/v1/coins/export/all", params={"format": "json"}, headers=auth_headers)
    assert r.headers["content-disposition"].endswith('.json"')


def test_export_empty_csv_has_header(client, auth_headers):
    r = client.get("/api/v1/coins/export/all", params={"format": "csv"}, headers=auth_headers)
    assert r.content.decode("utf-8-sig").startswith("title;")


def test_template_header_only(client, auth_headers):
    r = client.get("/api/v1/coins/import/template", headers=auth_headers)
    assert r.status_code == 200
    lines = r.content.decode("utf-8-sig").strip().splitlines()
    expected = [f for f in CoinCreate.model_fields if not f.startswith("image_url_")]
    assert len(lines) == 1 and lines[0].split(";") == expected
    assert client.get("/api/v1/coins/import/template").status_code in (401, 403)
