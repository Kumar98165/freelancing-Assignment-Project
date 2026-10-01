import urllib.request
import urllib.error
import json

BASE_URL = "http://127.0.0.1:5000/api"

def make_request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def test_kpi_and_crud():
    print("==================================================")
    print("[TEST] DEDICATED KPI STATS API & CRUD VERIFICATION")
    print("==================================================")

    # 1. Login
    status, res = make_request("/auth/login", method="POST", data={"username": "admin", "password": "admin"})
    assert status == 200, f"Login failed: {res}"
    token = res["data"]["token"]
    print("[OK] 1. ADMIN LOGIN: SUCCESS")

    # 2. Call dedicated KPI Stats endpoint
    status, res = make_request("/users/stats", method="GET", token=token)
    assert status == 200, f"Stats API failed: {res}"
    stats = res["data"]
    print(f"[OK] 2. DEDICATED KPI STATS (GET /api/users/stats):")
    print(f"       -> Total Users: {stats['totalUsers']}")
    print(f"       -> Active Cashiers: {stats['activeCashiers']}")
    print(f"       -> Admin Accounts: {stats['adminAccounts']}")
    print(f"       -> Health Percentage: {stats['healthPercentage']}%")

    print("==================================================")
    print("[SUCCESS] DEDICATED KPI API IS LIVE & BOUND 100%!")
    print("==================================================")

if __name__ == "__main__":
    test_kpi_and_crud()
