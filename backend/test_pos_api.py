import json
from app import create_app
from app.extensions import db
from app.models.product import Product
from app.models.sale import Sale

def test_pos_endpoints():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        # 1. Test GET /api/pos/products
        res = client.get('/api/pos/products')
        print(f"[*] GET /api/pos/products -> Status {res.status_code}")
        data = res.get_json()
        assert res.status_code == 200
        assert data['success'] is True
        products = data.get('products', [])
        print(f"    Loaded {len(products)} products for POS register.")

        if len(products) > 0:
            first_product = products[0]
            print(f"    Sample Product: {first_product['name']} (SKU: {first_product['sku']}, Stock: {first_product['stock']}, Price: TZS {first_product['price']})")

            # 2. Test POST /api/pos/checkout
            checkout_payload = {
                'items': [
                    {
                        'productId': first_product['id'],
                        'quantity': 1,
                        'unitPrice': first_product['price']
                    }
                ],
                'paymentMethod': 'Mobile Money',
                'provider': 'M-Pesa',
                'amountPaid': first_product['price'] * 1.18,
                'customerName': 'Juma Hassan',
                'customerPhone': '+255 712 345 678',
                'cashierName': 'John Masawe'
            }

            checkout_res = client.post(
                '/api/pos/checkout',
                data=json.dumps(checkout_payload),
                content_type='application/json'
            )
            print(f"[*] POST /api/pos/checkout -> Status {checkout_res.status_code}")
            checkout_data = checkout_res.get_json()
            assert checkout_res.status_code == 201
            assert checkout_data['success'] is True
            print(f"    Sale Ref: {checkout_data['sale']['id']}")
            print(f"    TRA VFD Receipt: {checkout_data['sale']['fiscalReceiptNo']}")
            print(f"    Total with VAT: TZS {checkout_data['sale']['total']}")

        # 3. Test GET /api/sales
        sales_res = client.get('/api/sales')
        print(f"[*] GET /api/sales -> Status {sales_res.status_code}")
        sales_data = sales_res.get_json()
        assert sales_res.status_code == 200
        assert sales_data['success'] is True
        print(f"    Total Sales in DB: {sales_data['total']}")
        print(f"    Total Revenue: TZS {sales_data['stats']['totalRevenue']}")
        print(f"    TRA Sync Rate: {sales_data['stats']['fiscalSyncRate']}%")

        print("\n[SUCCESS] ALL POS & SALES BACKEND API TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    test_pos_endpoints()
