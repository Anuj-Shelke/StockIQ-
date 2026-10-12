"""Comprehensive tests for Portfolio CRUD, Holdings management, and weight allocations."""


def test_portfolio_full_crud_and_weights(client, auth_headers):
    # 1. Create a portfolio with initial holdings
    create_payload = {
        "name": "Alpha Growth Strategy",
        "description": "Multi-asset diversified growth portfolio",
        "holdings": [
            {
                "symbol": "RELIANCE.NS",
                "asset_type": "stock",
                "quantity": 20.0,
                "buy_price": 2800.0,
                "current_price": 3000.0,
            },
            {
                "symbol": "TCS.NS",
                "asset_type": "stock",
                "quantity": 10.0,
                "buy_price": 4000.0,
                "current_price": 4200.0,
            },
        ],
    }
    create_res = client.post("/api/v1/portfolios", json=create_payload, headers=auth_headers)
    assert create_res.status_code == 201
    p_data = create_res.json()
    p_id = p_data["id"]
    assert p_data["name"] == "Alpha Growth Strategy"
    assert len(p_data["holdings"]) == 2
    assert p_data["total_invested"] == (20 * 2800) + (10 * 4000)
    assert p_data["total_value"] == (20 * 3000) + (10 * 4200)
    assert p_data["total_gain_loss"] > 0
    assert p_data["return_percentage"] > 0
    assert len(p_data["asset_allocation"]) > 0

    # Verify weight calculation: sum of weights should be ~100%
    weights_sum = sum(h["weight_percent"] for h in p_data["holdings"])
    assert round(weights_sum, 1) == 100.0

    # 2. Update portfolio metadata
    update_res = client.put(
        f"/api/v1/portfolios/{p_id}",
        json={"name": "Alpha Growth Strategy (Updated)", "description": "Updated description"},
        headers=auth_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Alpha Growth Strategy (Updated)"

    # 3. Add a new holding (Gold)
    add_holding_payload = {
        "symbol": "GOLD",
        "asset_type": "gold",
        "quantity": 5.0,
        "buy_price": 7000.0,
        "current_price": 7540.0,
    }
    add_h_res = client.post(
        f"/api/v1/portfolios/{p_id}/holdings",
        json=add_holding_payload,
        headers=auth_headers,
    )
    assert add_h_res.status_code == 201
    h_data = add_h_res.json()
    h_id = h_data["id"]
    assert h_data["symbol"] == "GOLD"
    assert h_data["quantity"] == 5.0

    # Verify portfolio now has 3 holdings and updated total value
    get_p_res = client.get(f"/api/v1/portfolios/{p_id}", headers=auth_headers)
    assert get_p_res.status_code == 200
    p_updated = get_p_res.json()
    assert len(p_updated["holdings"]) == 3
    categories = [a["category"].lower() for a in p_updated["asset_allocation"]]
    assert "stock" in categories
    assert "gold" in categories

    # 4. Update the newly added holding
    update_h_res = client.put(
        f"/api/v1/portfolios/{p_id}/holdings/{h_id}",
        json={"quantity": 10.0, "buy_price": 7100.0},
        headers=auth_headers,
    )
    assert update_h_res.status_code == 200
    updated_h = update_h_res.json()
    assert updated_h["quantity"] == 10.0

    # 5. Delete a holding
    del_h_res = client.delete(
        f"/api/v1/portfolios/{p_id}/holdings/{h_id}",
        headers=auth_headers,
    )
    assert del_h_res.status_code == 200
    assert del_h_res.json()["success"] is True

    # Verify holding removed
    get_p_after_del = client.get(f"/api/v1/portfolios/{p_id}", headers=auth_headers)
    assert len(get_p_after_del.json()["holdings"]) == 2

    # 6. Delete the entire portfolio
    del_p_res = client.delete(f"/api/v1/portfolios/{p_id}", headers=auth_headers)
    assert del_p_res.status_code == 200
    assert del_p_res.json()["success"] is True

    # Verify 404 when retrieving deleted portfolio
    get_deleted = client.get(f"/api/v1/portfolios/{p_id}", headers=auth_headers)
    assert get_deleted.status_code == 404
