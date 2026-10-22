PRIVATE = {"purchase_price", "estimated_value", "storage_location",
           "acquisition_source", "acquisition_date", "notes", "owner_id"}


def test_public_detail_hides_private_fields(client, make_coin):
    c = make_coin(purchase_price=10, storage_location="Cofre", notes="segredo")
    data = client.get(f"/api/v1/public/coins/{c.id}").json()
    assert PRIVATE.isdisjoint(data)


def test_public_list_hides_private_fields(client, make_coin):
    make_coin(purchase_price=10, storage_location="Cofre", notes="segredo")
    items = client.get("/api/v1/public/coins").json()["data"]
    assert len(items) == 1 and PRIVATE.isdisjoint(items[0])


def test_public_search_does_not_match_private_notes(client, make_coin):
    make_coin(notes="segredo")
    r = client.get("/api/v1/public/coins", params={"search": "segredo"})
    assert r.json()["meta"]["total_items"] == 0


def test_private_detail_requires_auth(client, make_coin):
    c = make_coin()
    assert client.get(f"/api/v1/coins/{c.id}").status_code == 401


def test_sale_price_hidden_when_not_for_sale(client, make_coin):
    c = make_coin(for_sale=False, sale_price=99)
    assert client.get(f"/api/v1/public/coins/{c.id}").json()["sale_price"] is None


def test_public_list_inverted_year_range_is_empty(client, make_coin):
    make_coin(year=1990)
    r = client.get("/api/v1/public/coins", params={"year_from": 2000, "year_to": 1980})
    assert r.status_code == 200 and r.json()["data"] == []


def test_facets(client, make_coin):
    make_coin(country="Portugal", year=1889); make_coin(country="Brasil", year=1994, category="Comemorativa")
    assert client.get("/api/v1/public/facets").json() == {
        "countries": ["Brasil", "Portugal"], "categories": ["Comemorativa"],
        "year_min": 1889, "year_max": 1994}


def test_filter_for_sale(client, make_coin):
    make_coin(for_sale=True); make_coin(for_sale=False)
    assert client.get("/api/v1/public/coins", params={"for_sale": True}).json()["meta"]["total_items"] == 1


def test_public_page_size_capped(client):
    assert client.get("/api/v1/public/coins", params={"page_size": 49}).status_code == 422


def test_public_sort_year_asc(client, make_coin):
    make_coin(year=2000); make_coin(year=1900)
    years = [c["year"] for c in client.get("/api/v1/public/coins", params={"sort": "year_asc"}).json()["data"]]
    assert years == [1900, 2000]


def test_private_list_search_catalog_ref(client, auth_headers, make_coin):
    make_coin(catalog_ref="KM# 652"); make_coin()
    r = client.get("/api/v1/coins", params={"search": "KM#"}, headers=auth_headers)
    assert r.json()["meta"]["total_items"] == 1
