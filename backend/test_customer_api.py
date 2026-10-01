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
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw": body}

def test_customers():
    print("==================================================")
    print("[TEST] CUSTOMER MODULE API & CRUD ON POSTGRESQL")
    print("==================================================")

    # 1. Login
    status, res = make_request("/auth/login", method="POST", data={"username": "admin", "password": "admin"})
    token = res["data"]["token"]
    print("[OK] 1. ADMIN LOGIN: SUCCESS")

    # 2. Dedicated KPI Stats
    status, res = make_request("/customers/stats", method="GET", token=token)
    assert status == 200, f"Customer stats failed ({status}): {res}"
    stats = res["data"]
    print(f"[OK] 2. CUSTOMER KPI STATS:")
    print(f"       -> Total Customers: {stats['totalCustomers']}")
    print(f"       -> Revenue: TSh {stats['customerRevenue']:,}")
    print(f"       -> Avg Lifetime Value: TSh {stats['avgLifetimeValue']:,}")
    print(f"       -> Top Spender: {stats['topSpender']}")
    print(f"       -> VIP Clients: {stats['vipCount']}")

    # 3. List Customers (READ)
    status, res = make_request("/customers", method="GET", token=token)
    assert status == 200, f"Get customers failed: {res}"
    print(f"[OK] 3. READ (GET /api/customers): Found {len(res['data']['customers'])} customers")

    # 4. Search Filter
    status, res = make_request(f"/customers?search={urllib.parse.quote('Juma')}", method="GET", token=token)
    assert status == 200, f"Search failed: {res}"
    assert len(res["data"]["customers"]) >= 1
    print(f"[OK] 4. SEARCH FILTER ('Juma'): Found {len(res['data']['customers'])} customer(s)")

    # 5. Tier Filter (VIP)
    status, res = make_request("/customers?tier=VIP", method="GET", token=token)
    assert status == 200, f"Tier filter failed: {res}"
    print(f"[OK] 5. TIER FILTER ('VIP'): Found {len(res['data']['customers'])} VIP customer(s)")

    # 6. CREATE (POST /api/customers)
    new_cust_data = {
        "name": "Baraka Mkama",
        "phone": "+255745999888",
        "email": "baraka.mkama@gmail.com"
    }
    status, res = make_request("/customers", method="POST", data=new_cust_data, token=token)
    assert status == 201, f"Create customer failed: {res}"
    created_cust = res["data"]["customer"]
    created_id = created_cust["id"]
    print(f"[OK] 6. CREATE CUSTOMER: Created ID={created_id}, Name='{created_cust['name']}'")

    # 7. READ SINGLE (GET /api/customers/<id>)
    status, res = make_request(f"/customers/{created_id}", method="GET", token=token)
    assert status == 200, f"Read single failed: {res}"
    print(f"[OK] 7. READ SINGLE CUSTOMER: Verified ID={created_id}")

    # 8. UPDATE (PUT /api/customers/<id>)
    update_data = {
        "name": "Baraka Mkama (VIP)",
        "email": "baraka.vip@gmail.com"
    }
    status, res = make_request(f"/customers/{created_id}", method="PUT", data=update_data, token=token)
    assert status == 200, f"Update failed: {res}"
    assert res["data"]["customer"]["name"] == "Baraka Mkama (VIP)"
    print(f"[OK] 8. UPDATE CUSTOMER: Updated Name to '{res['data']['customer']['name']}'")

    # 9. DELETE (DELETE /api/customers/<id>)
    status, res = make_request(f"/customers/{created_id}", method="DELETE", token=token)
    assert status == 200, f"Delete failed: {res}"
    print(f"[OK] 9. DELETE CUSTOMER: Customer ID {created_id} deleted successfully")

    print("==================================================")
    print("[SUCCESS] ALL CUSTOMER API ENDPOINTS PASSED 100%!")
    print("==================================================")

if __name__ == "__main__":
    test_customers()
