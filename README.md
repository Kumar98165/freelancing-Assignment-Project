# TzSuperPOS — Supermarket Management & POS System

A modern, full-stack enterprise Point of Sale (POS) and Supermarket Management System tailored for Tanzania and global retail operations. Built with a Flask (Python) REST API backend and a Vite + React + TypeScript frontend with Tailwind CSS aesthetics.

---

## 🚀 1-Click Master Application Launcher

You can start the **entire application** (both Frontend and Backend, along with dependency verification & database seeding) with **a single command or click**:

### Option A: Windows 1-Click Batch File
Double-click `start.bat` in the project root directory, or run:
```cmd
start.bat
```

### Option B: Cross-Platform Python Master Script (Windows / macOS / Linux)
Run the master python script:
```bash
python run_project.py
```

### Option C: Root npm Command
```bash
npm start
```

---

## 🛠️ System Architecture & Technologies

### Backend (`/backend`)
- **Language & Framework**: Python 3.10+ & Flask 3.1
- **Database**: PostgreSQL / SQLite with SQLAlchemy ORM
- **Authentication**: Flask-JWT-Extended (Role-based: Administrator & Cashier)
- **CORS**: Flask-CORS enabled

### Frontend (`/frontend`)
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Vanilla CSS & Tailwind CSS with Glassmorphism aesthetic
- **Icons & Charts**: Lucide-React & Recharts
- **PDF & Invoice Generation**: jsPDF + html2canvas

---

## 📋 Features Overview

### 1. POS Checkout Module (`/cashier`)
- Real-time Product Catalog Search & Barcode Scanner Integration.
- Dynamic Shopping Cart calculation with **Live Store VAT Rate (%)** from Settings.
- Multiple Payment Methods: Cash, Mobile Money (M-Pesa, Tigo Pesa, Airtel Money, HaloPesa), Card / Bank.
- Instant Fiscal Thermal Receipt Preview & Downloadable TRA VFD Verified PDF Receipts.

### 2. Admin & Cashier Dashboard
- Real-time summary statistics: Today's Revenue, Completed Sales, Active Customers, Low Stock Alerts.
- Dynamic Date Filtering: Daily, Weekly, Monthly, All-time, and Custom Date Range.
- Interactive Revenue & Transaction charts.

### 3. Customer Directory & Profiles (`/admin/customers` & `/cashier?tab=customers`)
- Lifetime value metrics, tier badges (VIP, Regular, New).
- Customer Profile detail page with full purchase history.
- **URL & Refresh Persistence**: Staying on customer detail pages (`/customer/:id` or `?id=...`) across browser reloads (`F5`).

### 4. Sales History & Order Tracking (`/admin/sales`)
- Complete transaction log with payment breakdown, cashier credentials, and printable receipts.

### 5. Inventory & Stock Management (`/admin/inventory`)
- Real-time stock levels, low-stock warnings, and stock adjustment audit logging.

### 6. Reports & Analytics (`/admin/reports`)
- 5 Specialized tabs: Revenue Analytics, Product Performance, Customer Insights, Cashier Performance, TRA Fiscalization.
- CSV Data Export for financial auditing.

### 7. Audit Logs (`/admin/audit-logs`)
- Enterprise audit trail recording system actions, user auth, IP addresses, device info, and event payloads.
- Filter by status (`SUCCESS`, `WARNING`, `FAILED`), category, and custom date range.

### 8. Settings & Store Configuration (`/admin/settings`)
- Configurable Store Name, Branch Name, TIN, VRN, VAT Rate (%), Receipt Tagline & Footer.

---

## ⚙️ Manual Step-by-Step Installation

If you prefer to set up services manually:

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python seed.py
python run.py
```
*Backend server runs at: `http://127.0.0.1:5000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend dev server runs at: `http://localhost:5173`*

---

## 🔑 Default Credentials

| Role | Username / Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` / `admin@tzamart.co.tz` | `admin123` | Full Access (Admin Panel & Cashier POS) |
| **Cashier** | `manoj` / `manoj@tzamart.co.tz` | `cashier123` | Cashier POS Terminal |

---

## 🧪 Verification Commands

To verify TypeScript code compilation cleanly:
```bash
cd frontend
npx tsc --noEmit
```

---

## 📄 License
This project is proprietary and confidential. All rights reserved.
