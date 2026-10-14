import uuid


def _register(client, label):
    response = client.post('/api/v1/auth/register', json={
        'email': f'{label}-{uuid.uuid4().hex}@example.com',
        'password': 'StrongPassword123!',
        'full_name': 'Isolation Test',
    })
    assert response.status_code == 201
    token = response.json()['tokens']['access_token']
    return {'Authorization': f'Bearer {token}'}


def test_new_users_start_empty_and_cannot_read_another_users_portfolio(client, monkeypatch):
    from app.integrations.market_data.market_service import MarketDataService
    monkeypatch.setattr(MarketDataService, 'get_quote', staticmethod(lambda _symbol: (_ for _ in ()).throw(RuntimeError('market feed disabled in test'))))
    first = _register(client, 'empty')
    second = _register(client, 'second')

    assert client.get('/api/v1/portfolios', headers=first).json() == []
    assert client.get('/api/v1/snapshots', headers=first).json() == []
    assert client.get('/api/v1/review-requests', headers=first).json() == []
    dashboard = client.get('/api/v1/dashboard', headers=first)
    assert dashboard.status_code == 200
    assert dashboard.json()['portfolios'] == []
    assert dashboard.json()['recent_activity'] == []
    assert client.get('/api/v1/analyses/risk-reality-check', headers=first).status_code == 404

    created = client.post('/api/v1/portfolios', headers=first, json={'name': 'Private Portfolio', 'holdings': []})
    assert created.status_code == 201
    portfolio_id = created.json()['id']
    assert created.json()['holdings'] == []
    assert client.get('/api/v1/portfolios', headers=second).json() == []
    assert client.get(f'/api/v1/portfolios/{portfolio_id}', headers=second).status_code == 404
    assert client.get(f'/api/v1/analyses/risk-reality-check/{portfolio_id}', headers=second).status_code == 404
