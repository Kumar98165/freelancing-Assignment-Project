from datetime import datetime, date
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.customer import Customer, CustomerPurchase
from app.models.product import Product
from app.models.category import Category

app = create_app()

def seed_database():
    with app.app_context():
        # Create all tables in PostgreSQL
        db.create_all()

        # 1. Seed Users (if empty)
        if not User.query.first():
            initial_users = [
                {
                    'full_name': 'System Administrator',
                    'username': 'admin',
                    'phone': '+255754111222',
                    'role': 'ADMIN',
                    'password': 'admin',
                    'status': 'Active'
                },
                {
                    'full_name': 'John Masawe (POS Cashier)',
                    'username': 'cashier',
                    'phone': '+255713333444',
                    'role': 'CASHIER',
                    'password': 'cashier',
                    'status': 'Active'
                },
                {
                    'full_name': 'Amina Salum (POS Cashier)',
                    'username': 'amina.cashier',
                    'phone': '+255784555666',
                    'role': 'CASHIER',
                    'password': 'cashier',
                    'status': 'Active'
                },
                {
                    'full_name': 'Peter Karia (POS Cashier)',
                    'username': 'peter.karia',
                    'phone': '+255655777888',
                    'role': 'CASHIER',
                    'password': 'cashier',
                    'status': 'Inactive'
                }
            ]

            for u_data in initial_users:
                user = User(
                    full_name=u_data['full_name'],
                    username=u_data['username'],
                    phone=u_data['phone'],
                    role=u_data['role'],
                    status=u_data['status']
                )
                user.set_password(u_data['password'])
                db.session.add(user)
            db.session.commit()
            print("Successfully seeded initial supermarket users (ADMIN & CASHIER only)!")

        # 2. Seed Customers (if empty)
        if not Customer.query.first():
            customers_data = [
                {
                    'name': 'Juma Rashid',
                    'phone': '+255754123456',
                    'email': 'juma.rashid@gmail.com',
                    'total_purchases': 2450000.0,
                    'last_purchase': date(2024, 12, 23),
                    'purchases': [
                        {
                            'sale_number': 'SALE-TZ-2026-00022',
                            'date': date(2024, 12, 23),
                            'items_summary': 'Mo Sunflower Oil, Azam Sugar',
                            'total': 63500.0,
                            'payment_method': 'CARD / BANK',
                            'items_json': [
                                {'name': 'Mo Sunflower Oil (5L)', 'qty': 1, 'unitPrice': 38500, 'totalPrice': 38500},
                                {'name': 'Azam Pure White Sugar (5kg)', 'qty': 1, 'unitPrice': 25000, 'totalPrice': 25000}
                            ]
                        },
                        {
                            'sale_number': 'SALE-TZ-2026-00010',
                            'date': date(2024, 12, 15),
                            'items_summary': 'Kilimanjaro Water (1.5L) 20x',
                            'total': 20000.0,
                            'payment_method': 'MOBILE MONEY',
                            'items_json': [
                                {'name': 'Kilimanjaro Pure Water (1.5L)', 'qty': 20, 'unitPrice': 1000, 'totalPrice': 20000}
                            ]
                        },
                        {
                            'sale_number': 'SALE-TZ-2026-00002',
                            'date': date(2024, 12, 1),
                            'items_summary': 'General Groceries Hamper',
                            'total': 180000.0,
                            'payment_method': 'CASH',
                            'items_json': [
                                {'name': 'Premium Groceries Family Hamper', 'qty': 2, 'unitPrice': 90000, 'totalPrice': 180000}
                            ]
                        }
                    ]
                },
                {
                    'name': 'Amina Salum',
                    'phone': '+255713987654',
                    'email': 'amina.salum@yahoo.com',
                    'total_purchases': 890000.0,
                    'last_purchase': date(2024, 12, 23),
                    'purchases': [
                        {
                            'sale_number': 'SALE-TZ-2026-00020',
                            'date': date(2024, 12, 23),
                            'items_summary': 'Bakhresa Rice 10kg, Water',
                            'total': 42000.0,
                            'payment_method': 'MOBILE MONEY',
                            'items_json': [
                                {'name': 'Bakhresa Super Aromatic Rice (10kg)', 'qty': 1, 'unitPrice': 32000, 'totalPrice': 32000},
                                {'name': 'Kilimanjaro Water (1.5L)', 'qty': 10, 'unitPrice': 1000, 'totalPrice': 10000}
                            ]
                        },
                        {
                            'sale_number': 'SALE-TZ-2026-00014',
                            'date': date(2024, 12, 18),
                            'items_summary': 'Household Cleaning Kit',
                            'total': 35000.0,
                            'payment_method': 'CASH',
                            'items_json': [
                                {'name': 'Household Essential Cleaning Kit', 'qty': 1, 'unitPrice': 35000, 'totalPrice': 35000}
                            ]
                        }
                    ]
                },
                {
                    'name': 'Godfrey Masawe',
                    'phone': '+255784555111',
                    'email': 'g.masawe@outlook.com',
                    'total_purchases': 310000.0,
                    'last_purchase': date(2024, 12, 22),
                    'purchases': [
                        {
                            'sale_number': 'SALE-TZ-2026-00019',
                            'date': date(2024, 12, 22),
                            'items_summary': 'Serengeti Lager Crate',
                            'total': 85000.0,
                            'payment_method': 'MOBILE MONEY',
                            'items_json': [
                                {'name': 'Serengeti Premium Lager Crate (24x)', 'qty': 1, 'unitPrice': 85000, 'totalPrice': 85000}
                            ]
                        }
                    ]
                },
                {
                    'name': 'Zuhura Bakari',
                    'phone': '+255655444888',
                    'email': None,
                    'total_purchases': 1680000.0,
                    'last_purchase': date(2024, 12, 20),
                    'purchases': [
                        {
                            'sale_number': 'SALE-TZ-2026-00016',
                            'date': date(2024, 12, 20),
                            'items_summary': 'Azam Wheat Flour, Sugar',
                            'total': 54000.0,
                            'payment_method': 'CASH',
                            'items_json': [
                                {'name': 'Azam All-Purpose Wheat Flour (5kg)', 'qty': 2, 'unitPrice': 14500, 'totalPrice': 29000},
                                {'name': 'Azam Pure White Sugar (5kg)', 'qty': 1, 'unitPrice': 25000, 'totalPrice': 25000}
                            ]
                        }
                    ]
                }
            ]

            for c_data in customers_data:
                purchases_list = c_data.pop('purchases')
                cust = Customer(**c_data)
                db.session.add(cust)
                db.session.flush() # get cust.id

                for p_data in purchases_list:
                    purchase = CustomerPurchase(
                        customer_id=cust.id,
                        sale_number=p_data['sale_number'],
                        date=p_data['date'],
                        items_summary=p_data['items_summary'],
                        total=p_data['total'],
                        payment_method=p_data['payment_method'],
                        items_json=p_data.get('items_json')
                    )
                    db.session.add(purchase)

            db.session.commit()
            print("Successfully seeded initial 4 supermarket customers with purchase history!")

        # 3. Seed Products (if empty)
        if not Product.query.first():
            products_data = [
                {
                    'name': 'Kilimanjaro Drinking Water (1.5L)',
                    'sku': 'BEV-KIL-15',
                    'category': 'Beverages',
                    'barcode': '6201234567890',
                    'barcode_type': 'MANUFACTURER',
                    'buying_price': 500.0,
                    'selling_price': 1000.0,
                    'stock': 120,
                    'min_stock': 50,
                    'tax': '18% VAT',
                    'status': 'Active',
                    'created_at': datetime(2024, 11, 15, 10, 0, 0),
                    'updated_at': datetime(2024, 12, 28, 14, 30, 0)
                },
                {
                    'name': 'Azam Wheat Flour (2kg)',
                    'sku': 'GRO-AZA-02',
                    'category': 'Groceries',
                    'barcode': 'TZ-INT-0001',
                    'barcode_type': 'INTERNAL',
                    'buying_price': 2000.0,
                    'selling_price': 2800.0,
                    'stock': 85,
                    'min_stock': 30,
                    'tax': '0% Exempt',
                    'status': 'Active',
                    'created_at': datetime(2024, 12, 1, 9, 0, 0),
                    'updated_at': datetime(2024, 12, 25, 11, 20, 0)
                },
                {
                    'name': 'Serengeti Premium Lager',
                    'sku': 'BEV-SER-01',
                    'category': 'Beverages',
                    'barcode': '6209876543210',
                    'barcode_type': 'MANUFACTURER',
                    'buying_price': 1800.0,
                    'selling_price': 2500.0,
                    'stock': 15,
                    'min_stock': 100,
                    'tax': '18% VAT',
                    'status': 'Inactive',
                    'created_at': datetime(2024, 10, 10, 8, 30, 0),
                    'updated_at': datetime(2024, 12, 15, 16, 45, 0)
                },
                {
                    'name': 'Tanga Fresh Milk (1L)',
                    'sku': 'DYE-MIL-01',
                    'category': 'Dairy & Eggs',
                    'barcode': '6201112223334',
                    'barcode_type': 'MANUFACTURER',
                    'buying_price': 1600.0,
                    'selling_price': 2200.0,
                    'stock': 0,
                    'min_stock': 25,
                    'tax': '0% Exempt',
                    'status': 'Inactive',
                    'created_at': datetime(2024, 12, 18, 12, 0, 0),
                    'updated_at': datetime(2024, 12, 20, 15, 0, 0)
                },
                {
                    'name': 'Mo Sunflower Cooking Oil (5L)',
                    'sku': 'GRO-OIL-05',
                    'category': 'Groceries',
                    'barcode': '6205556667778',
                    'barcode_type': 'MANUFACTURER',
                    'buying_price': 27000.0,
                    'selling_price': 34000.0,
                    'stock': 8,
                    'min_stock': 30,
                    'tax': '18% VAT',
                    'status': 'Active',
                    'created_at': datetime(2024, 12, 10, 14, 0, 0),
                    'updated_at': datetime(2024, 12, 29, 18, 10, 0)
                },
                {
                    'name': 'Bakhresa Super Sembe Flour (5kg)',
                    'sku': 'GRO-BAK-05',
                    'category': 'Groceries',
                    'barcode': '6208889991112',
                    'barcode_type': 'MANUFACTURER',
                    'buying_price': 9000.0,
                    'selling_price': 11500.0,
                    'stock': 45,
                    'min_stock': 20,
                    'tax': '0% Exempt',
                    'status': 'Active',
                    'created_at': datetime(2024, 12, 5, 10, 15, 0),
                    'updated_at': datetime(2024, 12, 27, 13, 50, 0)
                },
                {
                    'name': 'Red Gold Tomato Paste (400g)',
                    'sku': 'GRO-RED-04',
                    'category': 'Groceries',
                    'barcode': '6207773334445',
                    'barcode_type': 'MANUFACTURER',
                    'buying_price': 1200.0,
                    'selling_price': 1800.0,
                    'stock': 64,
                    'min_stock': 25,
                    'tax': '18% VAT',
                    'status': 'Active',
                    'created_at': datetime(2024, 11, 20, 11, 30, 0),
                    'updated_at': datetime(2024, 12, 22, 17, 0, 0)
                }
            ]

            for p_data in products_data:
                prod = Product(**p_data)
                db.session.add(prod)
            db.session.commit()
            print("Successfully seeded initial 7 supermarket products catalog!")

        # 4. Seed Categories (if empty)
        if not Category.query.first():
            categories_data = [
                {
                    'name': 'Beverages',
                    'description': 'Soft drinks, packaged water, juices, soda, alcohol',
                    'status': 'Active',
                    'created_at': datetime(2024, 1, 10, 8, 0, 0)
                },
                {
                    'name': 'Groceries',
                    'description': 'Flour, rice, sugar, cooking oil, spices, canned goods',
                    'status': 'Active',
                    'created_at': datetime(2024, 1, 10, 8, 30, 0)
                },
                {
                    'name': 'Dairy & Eggs',
                    'description': 'Fresh milk, yogurt, butter, cheese, farm fresh eggs',
                    'status': 'Active',
                    'created_at': datetime(2024, 1, 15, 9, 0, 0)
                },
                {
                    'name': 'Fresh Produce',
                    'description': 'Fresh local tomatoes, onions, fruits, vegetables',
                    'status': 'Active',
                    'created_at': datetime(2024, 2, 1, 9, 30, 0)
                },
                {
                    'name': 'Personal Care',
                    'description': 'Toothpaste, soaps, shampoos, lotions, deodorants',
                    'status': 'Active',
                    'created_at': datetime(2024, 2, 10, 10, 0, 0)
                },
                {
                    'name': 'Household Items',
                    'description': 'Detergents, cleaning products, paper towels, mop buckets',
                    'status': 'Inactive',
                    'created_at': datetime(2024, 3, 5, 11, 0, 0)
                }
            ]

            for c_data in categories_data:
                cat = Category(**c_data)
                db.session.add(cat)
            db.session.commit()
            print("Successfully seeded initial 6 supermarket categories!")

if __name__ == '__main__':
    seed_database()


