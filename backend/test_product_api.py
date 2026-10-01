import requests
import json

BASE_URL = "http://127.0.0.1:5000/api"

def run_tests():
    print("=" * 50)
    print("[TEST] PRODUCT MODULE API & CRUD ON POSTGRESQL")
    print("=" * 50)

    # 1. Login as Admin
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "admin"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] 1. ADMIN LOGIN: SUCCESS")

    # 2. Get Product KPI Stats
    stats_res = requests.get(f"{BASE_URL}/products/stats")
    assert stats_res.status_code == 200, f"Stats failed: {stats_res.text}"
    stats_data = stats_res.json()["data"]
    print("[OK] 2. PRODUCT KPI STATS:")
    print(f"       -> Total Products: {stats_data['totalProducts']}")
    print(f"       -> Active Products: {stats_data['activeProducts']}")
    print(f"       -> Low / Out of Stock: {stats_data['lowStockCount']}")
    print(f"       -> Inventory Value: TSh {stats_data['totalInventoryValue']:,}")
    print(f"       -> Categories: {stats_data['categories']}")

    # 3. Get Categories
    cats_res = requests.get(f"{BASE_URL}/products/categories")
    assert cats_res.status_code == 200, f"Categories failed: {cats_res.text}"
    print(f"[OK] 3. CATEGORIES: {cats_res.json()['data']}")

    # 4. List Products
    list_res = requests.get(f"{BASE_URL}/products")
    assert list_res.status_code == 200, f"List failed: {list_res.text}"
    products = list_res.json()["data"]
    print(f"[OK] 4. READ (GET /api/products): Found {len(products)} products")

    # 5. Search Filter ('Kilimanjaro')
    search_res = requests.get(f"{BASE_URL}/products?search=Kilimanjaro")
    assert search_res.status_code == 200
    search_data = search_res.json()["data"]
    assert len(search_data) >= 1
    print(f"[OK] 5. SEARCH FILTER ('Kilimanjaro'): Found {len(search_data)} product(s)")

    # 6. Category Filter ('Beverages')
    bev_res = requests.get(f"{BASE_URL}/products?category=Beverages")
    assert bev_res.status_code == 200
    bev_data = bev_res.json()["data"]
    print(f"[OK] 6. CATEGORY FILTER ('Beverages'): Found {len(bev_data)} product(s)")

    # 7. Status Filter ('Inactive')
    inact_res = requests.get(f"{BASE_URL}/products?status=Inactive")
    assert inact_res.status_code == 200
    inact_data = inact_res.json()["data"]
    print(f"[OK] 7. STATUS FILTER ('Inactive'): Found {len(inact_data)} product(s)")

    # 8. Create Product
    new_product_payload = {
        "name": "Afya Drinking Water (500ml)",
        "sku": "BEV-AFY-05",
        "category": "Beverages",
        "barcode": "6209998887776",
        "barcodeType": "MANUFACTURER",
        "buyingPrice": 300,
        "sellingPrice": 600,
        "stock": 100,
        "minStock": 20,
        "tax": "18% VAT",
        "status": "Active",
        "expiryDate": "2025-12-31"
    }
    create_res = requests.post(f"{BASE_URL}/products", json=new_product_payload, headers=headers)
    assert create_res.status_code == 201, f"Create failed: {create_res.text}"
    created_prod = create_res.json()["data"]
    created_id = created_prod["id"]
    print(f"[OK] 8. CREATE PRODUCT: Created ID={created_id}, Name='{created_prod['name']}'")

    # 9. Read Single Product
    single_res = requests.get(f"{BASE_URL}/products/{created_id}")
    assert single_res.status_code == 200
    assert single_res.json()["data"]["sku"] == "BEV-AFY-05"
    print(f"[OK] 9. READ SINGLE PRODUCT: Verified ID={created_id}")

    # 10. Update Product
    update_res = requests.put(f"{BASE_URL}/products/{created_id}", json={
        "name": "Afya Pure Mineral Water (500ml)",
        "sku": "BEV-AFY-05",
        "category": "Beverages",
        "barcode": "6209998887776",
        "barcodeType": "MANUFACTURER",
        "buyingPrice": 320,
        "sellingPrice": 650,
        "stock": 150,
        "minStock": 20,
        "tax": "18% VAT",
        "status": "Active"
    }, headers=headers)
    assert update_res.status_code == 200, f"Update failed: {update_res.text}"
    print(f"[OK] 10. UPDATE PRODUCT: Updated Name to '{update_res.json()['data']['name']}', Price: {update_res.json()['data']['sellingPrice']}")

    # 11. Toggle Status
    toggle_res = requests.patch(f"{BASE_URL}/products/{created_id}/toggle-status", headers=headers)
    assert toggle_res.status_code == 200, f"Toggle failed: {toggle_res.text}"
    print(f"[OK] 11. TOGGLE STATUS: New status: {toggle_res.json()['data']['status']}")

    # 12. Delete Product
    delete_res = requests.delete(f"{BASE_URL}/products/{created_id}", headers=headers)
    assert delete_res.status_code == 200, f"Delete failed: {delete_res.text}"
    print(f"[OK] 12. DELETE PRODUCT: Product ID {created_id} deleted successfully")

    print("=" * 50)
    print("[SUCCESS] ALL PRODUCT API ENDPOINTS PASSED 100%!")
    print("=" * 50)

if __name__ == '__main__':
    run_tests()
