from app import create_app, db
from app.models.sale import Sale
from app.utils.receipt_generator import generate_sale_receipt_pdf

app = create_app()

def test_pdf_feature():
    with app.app_context():
        sales = Sale.query.all()
        print(f"[*] Found {len(sales)} sales in DB.")
        for s in sales:
            if not s.pdf_data:
                pdf_bytes = generate_sale_receipt_pdf(s)
                s.pdf_data = pdf_bytes
                s.pdf_filename = f"Fiscal-Receipt-{s.sale_number}.pdf"
                print(f"    -> Generated and saved {len(pdf_bytes)} bytes PDF for {s.sale_number}")
        db.session.commit()

        client = app.test_client()
        if sales:
            target_sale = sales[0]
            resp = client.get(f"/api/sales/{target_sale.sale_number}/receipt/pdf")
            print(f"[*] Download endpoint response:")
            print(f"    Status: {resp.status_code}")
            print(f"    Content-Type: {resp.headers.get('Content-Type')}")
            print(f"    Content-Disposition: {resp.headers.get('Content-Disposition')}")
            print(f"    File Size: {len(resp.data)} bytes")
            assert resp.status_code == 200
            assert resp.headers.get('Content-Type') == 'application/pdf'
            assert len(resp.data) > 1000
            print("[SUCCESS] PDF Generation, Database BYTEA storage, and Download Endpoint Verified!")

if __name__ == '__main__':
    test_pdf_feature()
