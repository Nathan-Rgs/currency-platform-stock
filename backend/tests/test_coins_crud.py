def test_create_coin_with_catalog_fields(client, auth_headers):
    body = {"title": "1 Real", "year": 1994, "country": "Brasil", "face_value": "1 Real",
            "catalog_ref": "KM# 652", "material": "Aço inox", "diameter_mm": 24.0,
            "weight_g": 4.27, "for_sale": True, "sale_price": 30}
    r = client.post("/api/v1/coins", json=body, headers=auth_headers)
    assert r.status_code == 201
    assert r.json()["catalog_ref"] == "KM# 652"
    assert r.json()["for_sale"] is True


def test_year_in_future_rejected(client, auth_headers):
    body = {"title": "x", "year": 3000, "country": "Brasil", "face_value": "1"}
    assert client.post("/api/v1/coins", json=body, headers=auth_headers).status_code == 422
