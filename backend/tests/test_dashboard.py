from models.user import User

URL = "/api/v1/dashboard/summary"


def test_summary_multiplies_quantity(client, auth_headers, make_coin):
    make_coin(quantity=3, estimated_value=10, purchase_price=2)
    make_coin(quantity=1, estimated_value=5, for_sale=True)
    s = client.get(URL, headers=auth_headers).json()
    assert (s["total_items"], s["total_pieces"]) == (2, 4)
    assert s["total_estimated_value"] == 35
    assert s["total_invested"] == 6
    assert s["total_for_sale"] == 1
    assert "total_coins" not in s


def test_summary_empty_collection(client, auth_headers):
    s = client.get(URL, headers=auth_headers).json()
    assert s["total_items"] == 0
    assert s["total_pieces"] == 0
    assert s["total_estimated_value"] == 0
    assert s["total_invested"] == 0
    assert s["recent"] == []
    assert s["by_category"] == []


def test_summary_excludes_other_users(client, auth_headers, make_coin, db):
    other = User(email="other@test.com", hashed_password="x")
    db.add(other)
    db.commit()
    make_coin(quantity=2, estimated_value=10)
    make_coin(owner_id=other.id, quantity=9, estimated_value=100)
    s = client.get(URL, headers=auth_headers).json()
    assert (s["total_items"], s["total_pieces"]) == (1, 2)
    assert s["total_estimated_value"] == 20
    assert len(s["recent"]) == 1


def test_summary_category_and_recent(client, auth_headers, make_coin):
    for i in range(6):
        make_coin(title=f"m{i}", category="A" if i < 4 else None)
    make_coin(title="b", category="B")
    s = client.get(URL, headers=auth_headers).json()
    assert s["by_category"] == [{"category": "A", "count": 4}, {"category": "B", "count": 1}]
    assert len(s["recent"]) == 5
    assert s["recent"][0]["title"] == "b"
