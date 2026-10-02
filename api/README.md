# TzSuperPOS — Backend API Documentation & Developer Guide

Welcome to the central API catalog for **TzSuperPOS Backend**. This directory contains all REST API route definitions, HTTP methods, payload schemas, query parameters, and Postman resources used across the application.

---

## 📌 Base URL
```
http://127.0.0.1:5000/api
```

---

## 🔐 Authentication & Headers

Most endpoints require a JWT Bearer token obtained via `/api/auth/login`.

```http
Authorization: Bearer <YOUR_JWT_ACCESS_TOKEN>
Content-Type: application/json
```

---

## 📂 API Route Summary Table

| Category | HTTP Method | Route Endpoint | Description |
| :--- | :---: | :--- | :--- |
| **Health** | `GET` | `/api/health` | Check API server status |
| **Auth** | `POST` | `/api/auth/login` | Login & receive JWT token |
| | `GET` | `/api/auth/me` | Current authenticated user profile |
| | `POST` | `/api/auth/refresh` | Refresh JWT access token |
| | `POST` | `/api/auth/change-password` | Update current user password |
| **Dashboard** | `GET` | `/api/dashboard/summary` | Live KPI cards, sales chart & recent transactions |
| **POS Sales** | `POST` | `/api/sales/checkout` | Complete POS checkout & produce TRA receipt |
| | `GET` | `/api/sales` | Fetch paginated sales history list |
| | `GET` | `/api/sales/receipt/:saleNo` | Fetch printable TRA receipt details |
| **Customers** | `GET` | `/api/customers` | Fetch customer directory with filters |
| | `GET` | `/api/customers/stats` | Customer count & lifetime value KPIs |
| | `GET` | `/api/customers/:id` | Fetch single customer record |
| | `GET` | `/api/customers/:id/profile` | Customer purchase history & spending cards |
| | `POST` | `/api/customers` | Create new customer record |
| | `PUT` | `/api/customers/:id` | Update customer record |
| | `DELETE` | `/api/customers/:id` | Delete customer record |
| **Products** | `GET` | `/api/products` | Fetch product catalog list |
| | `POST` | `/api/products` | Add new product to catalog |
| | `PUT` | `/api/products/:id` | Update product details/price |
| | `DELETE` | `/api/products/:id` | Delete product item |
| **Categories**| `GET` | `/api/categories` | Fetch category list |
| | `POST` | `/api/categories` | Add new category |
| **Inventory** | `GET` | `/api/inventory` | Fetch inventory stock levels & warnings |
| | `POST` | `/api/inventory/adjust` | Adjust stock quantity with audit entry |
| | `GET` | `/api/inventory/stats` | Stock levels KPI summary |
| **Reports** | `GET` | `/api/reports/summary` | Analytics across 5 tabs (Revenue, Products, Customers, Cashiers, TRA VAT) |
| **Audit Logs**| `GET` | `/api/audit-logs` | Fetch system audit logs & security metrics |
| | `POST` | `/api/audit-logs` | Log client/server system event |
| **Settings** | `GET` | `/api/settings` | Store details, TIN, VRN, VAT Rate (%) |
| | `PUT` | `/api/settings` | Update store configuration & VAT rate |
| **Users** | `GET` | `/api/users` | List staff accounts (Admin / Cashier) |
| | `POST` | `/api/users` | Create staff account |
| | `PUT` | `/api/users/:id` | Update staff account role/status |
| | `DELETE` | `/api/users/:id` | Remove staff user |

---

## 📑 Detailed Payload & Query Specifications

### 1. User Login (`POST /api/auth/login`)
**Request Payload:**
```json
{
  "username": "manoj123",
  "password": "12345"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "refreshToken": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "2",
      "fullName": "Manoj Cashier",
      "username": "manoj123",
      "role": "CASHIER",
      "status": "Active"
    }
  }
}
```

---

### 2. POS Checkout (`POST /api/sales/checkout`)
**Request Payload:**
```json
{
  "items": [
    {
      "productId": "1",
      "quantity": 2,
      "unitPrice": 4500,
      "discountPercent": 0
    }
  ],
  "paymentMethod": "CASH",
  "customerName": "Walk-in Customer",
  "amountPaid": 10000
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Checkout completed successfully",
  "data": {
    "sale": {
      "sale_number": "SALE-TZ-2026-90412",
      "total": 10620,
      "change_amount": 0,
      "fiscal_receipt_no": "TRA-VFD-2026-88192044"
    }
  }
}
```

---

### 3. Dashboard Summary (`GET /api/dashboard/summary`)
**Query Parameters:** `preset=TODAY|WEEK|MONTH|ALL`, `startDate=YYYY-MM-DD`, `endDate=YYYY-MM-DD`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "kpi": {
      "totalSales": 1245600,
      "totalOrders": 24,
      "avgOrderValue": 51900,
      "itemsSold": 88
    },
    "chartData": [
      { "name": "08:00", "sales": 25000 },
      { "name": "12:00", "sales": 135000 }
    ],
    "recentTransactions": []
  }
}
```

---

### 4. Audit Logs (`GET /api/audit-logs`)
**Query Parameters:** `search`, `category`, `status`, `page=1`, `limit=20`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "LOG-00001",
        "action": "USER_LOGIN_SUCCESS",
        "category": "AUTH",
        "userName": "Manoj Cashier",
        "userRole": "Cashier",
        "ipAddress": "192.168.1.104",
        "deviceInfo": "Chrome 122.0 (Windows 11)",
        "details": "Authenticated successfully",
        "status": "SUCCESS",
        "createdAt": "2026-10-02 08:54:10"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "stats": {
      "totalLogs": 8,
      "securityAlerts": 2,
      "authEvents": 3,
      "activeOperators": 2
    }
  }
}
```

---

## 🛠️ Files Included in `/api` Directory
- [`api/endpoints.json`](file:///c:/Users/NexviTech/Desktop/Freelancing_project/api/endpoints.json): Machine-readable JSON catalog of all API endpoints.
- [`api/README.md`](file:///c:/Users/NexviTech/Desktop/Freelancing_project/api/README.md): This reference manual.
- [`frontend/src/api/endpoints.ts`](file:///c:/Users/NexviTech/Desktop/Freelancing_project/frontend/src/api/endpoints.ts): Central TypeScript endpoint registry used in frontend code.
- [`frontend/src/api/index.ts`](file:///c:/Users/NexviTech/Desktop/Freelancing_project/frontend/src/api/index.ts): Module index re-exporting all service abstractions.
