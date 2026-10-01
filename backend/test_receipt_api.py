import requests
import io
from app import create_app, db
from app.models.sale import Sale

def test_live_receipt_download_api():
    base_url = "http://127.0.0.1:5000/api"
    print("="*65)
    print("[*] TESTING BACKEND RECEIPT PDF DOWNLOAD API")
    print("="*65)

    # 1. Health check
    try:
        h_res = requests.get(f"{base_url}/health", timeout=3)
        print(f"[*] 1. Backend Server Health Check: Status {h_res.status_code}")
        print(f"    Server Response: {h_res.json()}")
    except Exception as e:
        print(f"[!] Warning: Could not connect to live server directly: {e}")

    # 2. Test using Flask Test Client & Live DB
    app = create_app()
    with app.app_context():
        # Get the latest sale in DB
        latest_sale = Sale.query.order_by(Sale.id.desc()).first()
        if not latest_sale:
            print("[!] No sales found in DB. Creating a test sale...")
            # create a test sale
            client = app.test_client()
            checkout_res = client.post("/api/pos/checkout", json={
                "items": [{"id": 1, "quantity": 1, "unitPrice": 897}],
                "paymentMethod": "CASH",
                "amountPaid": 1058,
                "cashierName": "John Cashier",
                "customerName": "Walk-in Customer"
            })
            print(f"[*] Created sale: {checkout_res.status_code}")
            latest_sale = Sale.query.order_by(Sale.id.desc()).first()

        sale_number = latest_sale.sale_number
        print(f"\n[*] 2. Target Sale Identifier: {sale_number}")
        print(f"    DB ID: {latest_sale.id}")
        print(f"    Total: TZS {latest_sale.total}")
        print(f"    Cashier: {latest_sale.cashier_name}")

        # 3. Test GET /api/sales/<sale_number>/receipt/pdf
        client = app.test_client()
        url = f"/api/sales/{sale_number}/receipt/pdf"
        print(f"\n[*] 3. Requesting: GET {url}")
        
        resp = client.get(url)
        print(f"    Response Status: {resp.status_code}")
        print(f"    Content-Type: {resp.headers.get('Content-Type')}")
        print(f"    Content-Disposition: {resp.headers.get('Content-Disposition')}")
        print(f"    Byte Size: {len(resp.data)} bytes")

        # Validate PDF binary signature (%PDF-)
        is_valid_pdf = resp.data.startswith(b'%PDF-')
        print(f"    Valid PDF Header (%PDF-): {is_valid_pdf}")

        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert 'application/pdf' in resp.headers.get('Content-Type', ''), "Invalid content type"
        assert is_valid_pdf, "Downloaded data is not a valid PDF binary file"
        assert len(resp.data) > 1000, "PDF byte size is too small"

        # 4. Save sample PDF to disk to verify file integrity
        sample_path = "test_downloaded_receipt.pdf"
        with open(sample_path, "wb") as f:
            f.write(resp.data)
        print(f"\n[*] 4. Saved test PDF to: {sample_path} (Size: {len(resp.data)} bytes)")

        # 5. Test OPTIONS Preflight Request
        preflight_resp = client.open(url, method='OPTIONS', headers={
            'Origin': 'http://localhost:5173',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'authorization,content-type'
        })
        print(f"\n[*] 5. Preflight OPTIONS Request Status: {preflight_resp.status_code}")
        print(f"    Access-Control-Allow-Origin: {preflight_resp.headers.get('Access-Control-Allow-Origin')}")
        print(f"    Access-Control-Allow-Methods: {preflight_resp.headers.get('Access-Control-Allow-Methods')}")
        assert preflight_resp.status_code == 200

        print("\n" + "="*65)
        print("[SUCCESS] ALL RECEIPT PDF DOWNLOAD API TESTS PASSED 100%!")
        print("="*65)

if __name__ == '__main__':
    test_live_receipt_download_api()
