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


def test_import_csv_cp1252(client, auth_headers):
    csv = "title;year;country;face_value\nRéis;1889;Portugal;20 Réis\n".encode("cp1252")
    assert _post(client, auth_headers, "c.csv", csv).json() == {"inserted": 1, "errors": []}
    got = client.get("/api/v1/coins", headers=auth_headers).json()["data"][0]
    assert got["title"] == "Réis"


def test_import_br_dates(client, auth_headers):
    csv = (
        "title;year;country;face_value;acquisition_date\n"
        "a;1994;BR;1;18/12/2024\nb;1994;BR;1;18/12/2024 10:30\n"
        "c;1994;BR;1;2024-12-18\nd;1994;BR;1;31/02/2024\n"
    ).encode()
    r = _post(client, auth_headers, "c.csv", csv).json()
    assert r["inserted"] == 3 and [e["row"] for e in r["errors"]] == [4]
    data = client.get("/api/v1/coins", headers=auth_headers).json()["data"]
    assert all(c["acquisition_date"].startswith("2024-12-18") for c in data)


def test_json_import_ignores_image_and_id_keys(client, auth_headers):
    row = {"title": "a", "year": 1994, "country": "BR", "face_value": "1",
           "id": 99, "owner_id": 7, "image_url_front": "x.png"}
    r = _post(client, auth_headers, "c.json", json.dumps([row]).encode(), "application/json")
    assert r.json() == {"inserted": 1, "errors": []}
    got = client.get("/api/v1/coins", headers=auth_headers).json()["data"][0]
    assert got["image_url_front"] is None and got["id"] != 99


def test_csv_header_case_insensitive(client, auth_headers):
    csv = b"Title;YEAR;Country;Face_Value\nx;1994;BR;1\n"
    assert _post(client, auth_headers, "c.csv", csv).json() == {"inserted": 1, "errors": []}


def test_csv_blank_rows_skipped_numbering_kept(client, auth_headers):
    csv = b"title;year;country;face_value\nx;1994;BR;1\n;;;\n;;;\n"
    assert _post(client, auth_headers, "c.csv", csv).json() == {"inserted": 1, "errors": []}
    csv = b"title;year;country;face_value\n;;;\nbad;abc;BR;1\n"
    assert _post(client, auth_headers, "c.csv", csv).json()["errors"][0]["row"] == 2


def test_csv_blank_quantity_defaults_to_1(client, auth_headers):
    csv = b"title;year;country;face_value;quantity;originality\nx;1994;BR;1;;\n"
    assert _post(client, auth_headers, "c.csv", csv).json()["inserted"] == 1
    got = client.get("/api/v1/coins", headers=auth_headers).json()["data"][0]
    assert got["quantity"] == 1
