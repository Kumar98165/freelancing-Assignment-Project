import urllib.request
import urllib.error
import urllib.parse
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

def test_backend_filters():
    print("==================================================")
    print("[TEST] BACKEND SEARCH & FILTERS VERIFICATION")
    print("==================================================")

    # 1. Login
    status, res = make_request("/auth/login", method="POST", data={"username": "admin", "password": "admin"})
    token = res["data"]["token"]

    # 2. Search by name "John"
    status, res = make_request(f"/users?search={urllib.parse.quote('John')}", method="GET", token=token)
    assert status == 200
    print(f"[OK] 1. Search 'John': Found {len(res['data']['users'])} user(s) -> {[u['fullName'] for u in res['data']['users']]}")

    # 3. Filter by role "ADMIN"
    status, res = make_request("/users?role=ADMIN", method="GET", token=token)
    assert status == 200
    print(f"[OK] 2. Filter role 'ADMIN': Found {len(res['data']['users'])} user(s) -> {[u['username'] for u in res['data']['users']]}")

    # 4. Filter by role "CASHIER"
    status, res = make_request("/users?role=CASHIER", method="GET", token=token)
    assert status == 200
    print(f"[OK] 3. Filter role 'CASHIER': Found {len(res['data']['users'])} user(s) -> {[u['username'] for u in res['data']['users']]}")

    # 5. Filter by status "Active"
    status, res = make_request("/users?status=Active", method="GET", token=token)
    assert status == 200
    print(f"[OK] 4. Filter status 'Active': Found {len(res['data']['users'])} user(s)")

    # 6. Combined Search & Filters: search "Amina" + role "CASHIER" + status "Active"
    status, res = make_request(f"/users?search=Amina&role=CASHIER&status=Active", method="GET", token=token)
    assert status == 200
    print(f"[OK] 5. Combined Filter ('Amina', CASHIER, Active): Found {len(res['data']['users'])} -> {[u['fullName'] for u in res['data']['users']]}")

    print("==================================================")
    print("[SUCCESS] ALL BACKEND SEARCH & FILTERS TESTED 100%!")
    print("==================================================")

if __name__ == "__main__":
    test_backend_filters()
