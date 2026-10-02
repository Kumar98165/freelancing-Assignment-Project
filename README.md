# Tanzanian Supermarket Management & POS System (TzSuperPOS)

[![Dockerized](https://img.shields.io/badge/Docker-Enabled-blue.svg)](file:///c:/Users/NexviTech/Desktop/Freelancing_project/docker-compose.yml)
[![License](https://img.shields.io/badge/License-Proprietary-purple.svg)](#)

A full-stack Point of Sale (POS) and Supermarket Management System adapted to the Tanzanian retail environment. Built with a **Flask (Python)** REST API backend and a **Vite + React + TypeScript** frontend styled with Tailwind CSS.

---

## 🐳 Docker Setup (Mandatory Assessment Requirement)

You can run the entire application (Database, Flask API backend, and Vite Frontend) in Docker without installing Python or Node.js on your host machine.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.

### 1-Command Startup
```bash
git clone https://github.com/Kumar98165/freelancing-Assignment-Project.git
cd freelancing-Assignment-Project
docker compose up --build
```

- **Frontend Application UI**: `http://localhost:5173`
- **Backend REST API**: `http://127.0.0.1:5000`

### Docker Environment Controls
```bash
# View live logs across containers
docker compose logs -f

# Stop all containers
docker compose down

# Reset environment and rebuild
docker compose down -v
docker compose up --build
```

---

## ⚡ Non-Docker 1-Click Startup

If running locally without Docker:
- **Windows**: Double-click [`start.bat`](file:///c:/Users/NexviTech/Desktop/Freelancing_project/start.bat) or run `start.bat` in CMD.
- **Cross-Platform**: Run `python run_project.py` or `npm start`.

---

## 🔑 Demo Access Credentials

| Role | Username | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full Access (Dashboard, Products, Inventory, Sales, Customers, Audit Logs, Settings) |
| **Cashier** | `manoj123` | `12345` | Cashier POS Terminal & Sale Checkout |
| **Cashier (Alt)** | `cashier` | `cashier123` | Cashier POS Terminal |

---

## 🏷️ Barcode Concepts Implementation

The system supports **two distinct barcode concepts**:

1. **Manufacturer / Existing Barcodes** (`MANUFACTURER`):
   - Used for pre-packaged goods provided by manufacturers (e.g. `5449000000996` for Coca-Cola 500ml, `6001000100` for Kilima Water).
   - Scanned via USB scanner or searched in POS.

2. **Internal Supermarket Barcodes** (`INTERNAL`):
   - Custom internal codes assigned to unpackaged/fresh items (e.g. `NJS-FRT-00001` or `INT-TOM-001` for Fresh Tomatoes 1KG).
   - Distinguished from manufacturer barcodes in inventory & POS lookup.

---

## 🇹🇿 TRA / EFD Fiscalization Architecture

The system features a **Mock Fiscalization Service** that simulates TRA (Tanzania Revenue Authority) VFD server communication without requiring live production credentials.

```
Cashier POS Checkout -> Sales Service -> FiscalReceiptService -> Mock TRA VFD Gateway -> Verify Status (SUCCESS/WARNING/FAILED) -> Thermal & PDF Receipt
```

- Every sale receives a **Fiscalization Status** (`SUCCESS`, `WARNING`, `FAILED`), **TRA Fiscal Receipt Number**, **EFD Device Serial** (`EFD-TZ-DAR-001`), and **Verification Code**.
- Receipts render fiscal information separately from normal purchase totals.

---

## 🧪 Required Final Assessment Demonstrations (Test 1 - Test 7)

### Test 1 — Manufacturer Barcode
1. Log in as **Cashier** (`manoj123` / `12345`).
2. In POS search/barcode input, type manufacturer barcode `5449000000996` and press Enter.
3. **Result**: "Mo Sunflower Oil (5L)" (or pre-registered item) is found and added to the shopping cart.

### Test 2 — Internal Barcode
1. In POS search/barcode input, type internal barcode `INT-TOM-001` or `NJS-FRT-00001` and press Enter.
2. **Result**: "Fresh Tomatoes (1KG)" (Internal Code) is recognized and added to the cart.

### Test 3 — Complete Sale & Receipt Generation
1. Add items to cart and select payment method (Cash, Mobile Money M-Pesa, or Card).
2. Click **Complete Sale**.
3. **Result**:
   - Inventory stock is reduced automatically.
   - Mock TRA Fiscalization verifies transaction (`SUCCESS`).
   - Printable TRA Thermal Receipt Modal opens with PDF download option.

### Test 4 — Unknown Barcode Handling
1. Type a non-existent barcode e.g. `9999999999999` in POS barcode input.
2. **Result**: System displays explicit alert: *"Product not found. Please register this barcode before selling it."* Item is **not** silently created.

### Test 5 — Insufficient Stock Prevention
1. Add an item with stock 5 (e.g., SKU item) and set quantity to `99`.
2. **Result**: POS displays stock limit warning and prevents completing the sale until quantity is reduced.

### Test 6 — Duplicate Barcode Prevention
1. Go to Admin -> Products -> **Add Product**.
2. Enter an existing barcode (e.g., `5449000000996`).
3. **Result**: Backend validation returns HTTP 400 error: *"Product with barcode '5449000000996' already exists."*

### Test 7 — Fiscalization Failure Handling
1. Go to Admin -> Reports -> TRA Fiscalization tab, or select an offline VFD device ID in Settings.
2. Complete a sale when TRA server simulation is set to `WARNING` or `FAILED`.
3. **Result**: Transaction marks fiscalization status as `WARNING`/`FAILED`, logs security event in Audit Logs (`/admin/audit-logs`), and flags transaction for auto-resync without corrupting sale totals.

---

## 📁 Repository Directory Structure

```text
freelancing-Assignment-Project/
├── api/                        # Centralized API Documentation & Endpoints Catalog
│   ├── README.md               # API Manual
│   └── endpoints.json          # Machine-readable JSON endpoints
├── backend/                    # Flask (Python) REST API
│   ├── app/
│   │   ├── models/             # SQLAlchemy Models (User, Product, Sale, AuditLog, etc.)
│   │   ├── routes/             # API Blueprints (auth, pos, sales, inventory, audit, etc.)
│   │   └── services/           # Fiscalization & Business Logic Services
│   ├── Dockerfile              # Backend Container Spec
│   ├── requirements.txt        # Python Dependencies
│   ├── seed.py                 # Database Initialization & Demo Seeder
│   └── run.py                  # Entry Point
├── frontend/                   # React + TypeScript + Vite UI
│   ├── src/
│   │   ├── api/                # Endpoints Registry & Re-exports
│   │   ├── components/         # POS, Customers, Admin Sidebar & Common UI
│   │   ├── pages/              # Admin Dashboard, POS, Reports, Audit Logs, Settings
│   │   └── services/           # Axios API Services
│   ├── Dockerfile              # Frontend Container Spec
│   └── package.json
├── docker-compose.yml          # Master Docker Orchestration
├── run_project.py              # Cross-Platform Python Master Launcher
├── start.bat                   # 1-Click Windows Launcher
├── .env.example                # Safe Environment Variables Template
└── README.md                   # Complete Documentation
```

---

## 🔒 Security Practices
- Password hashes generated via `werkzeug.security` (SHA256/Bcrypt).
- JWT token authentication for protected endpoints.
- Role-based authorization enforced at API level (`ADMIN` vs `CASHIER`).
- Sensitive `.env` credentials excluded via `.gitignore`.
