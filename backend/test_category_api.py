import requests

BASE_URL = "http://127.0.0.1:5000/api"

def run_tests():
    print("=" * 50)
    print("[TEST] CATEGORY MODULE API & CRUD ON POSTGRESQL")
    print("=" * 50)

    # 1. Login
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "admin"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] 1. ADMIN LOGIN: SUCCESS")

    # 2. KPI Stats
    stats_res = requests.get(f"{BASE_URL}/categories/stats")
    assert stats_res.status_code == 200, f"Stats failed: {stats_res.text}"
    stats_data = stats_res.json()["data"]
    print("[OK] 2. CATEGORY KPI STATS:")
    print(f"       -> Total Categories: {stats_data['totalCategories']} Depts")
    print(f"       -> Active Categories: {stats_data['activeCategories']} Active")
    print(f"       -> Linked Products: {stats_data['linkedProducts']} Items")
    print(f"       -> Top Category: {stats_data['topCategory']['name']} ({stats_data['topCategory']['productCount']} Products)")

    # 3. List Categories
    list_res = requests.get(f"{BASE_URL}/categories")
    assert list_res.status_code == 200, f"List failed: {list_res.text}"
    categories = list_res.json()["data"]
    print(f"[OK] 3. READ (GET /api/categories): Found {len(categories)} categories")

    # 4. Search Filter ('Beverages')
    search_res = requests.get(f"{BASE_URL}/categories?search=Beverages")
    assert search_res.status_code == 200
    search_data = search_res.json()["data"]
    print(f"[OK] 4. SEARCH FILTER ('Beverages'): Found {len(search_data)} category(s)")

    # 5. Status Filter ('Inactive')
    inact_res = requests.get(f"{BASE_URL}/categories?status=Inactive")
    assert inact_res.status_code == 200
    inact_data = inact_res.json()["data"]
    print(f"[OK] 5. STATUS FILTER ('Inactive'): Found {len(inact_data)} category(s)")

    # 6. Create Category
    new_cat_payload = {
        "name": "Bakery & Snacks",
        "description": "Fresh bread, cakes, crisps, biscuits, pastries",
        "status": "Active"
    }
    create_res = requests.post(f"{BASE_URL}/categories", json=new_cat_payload, headers=headers)
    assert create_res.status_code == 201, f"Create failed: {create_res.text}"
    created_cat = create_res.json()["data"]
    created_id = created_cat["id"]
    print(f"[OK] 6. CREATE CATEGORY: Created ID={created_id}, Name='{created_cat['name']}'")

    # 7. Read Single Category
    single_res = requests.get(f"{BASE_URL}/categories/{created_id}")
    assert single_res.status_code == 200
    print(f"[OK] 7. READ SINGLE CATEGORY: Verified ID={created_id}")

    # 8. Update Category
    update_res = requests.put(f"{BASE_URL}/categories/{created_id}", json={
        "name": "Bakery & Confectionery",
        "description": "Freshly baked bread, sweet pastries, and candies",
        "status": "Active"
    }, headers=headers)
    assert update_res.status_code == 200, f"Update failed: {update_res.text}"
    print(f"[OK] 8. UPDATE CATEGORY: Updated Name to '{update_res.json()['data']['name']}'")

    # 9. Toggle Status
    toggle_res = requests.patch(f"{BASE_URL}/categories/{created_id}/toggle-status", headers=headers)
    assert toggle_res.status_code == 200, f"Toggle failed: {toggle_res.text}"
    print(f"[OK] 9. TOGGLE STATUS: New status: {toggle_res.json()['data']['status']}")

    # 10. Delete Category
    delete_res = requests.delete(f"{BASE_URL}/categories/{created_id}", headers=headers)
    assert delete_res.status_code == 200, f"Delete failed: {delete_res.text}"
    print(f"[OK] 10. DELETE CATEGORY: Category ID {created_id} deleted successfully")

    print("=" * 50)
    print("[SUCCESS] ALL CATEGORY API ENDPOINTS PASSED 100%!")
    print("=" * 50)

if __name__ == '__main__':
    run_tests()
