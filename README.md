# MegaStore Global - Data Migration & API

Modern architecture for retail inventory and sales management, migrating from legacy Excel systems to a robust SQL/NoSQL hybrid solution.

# Project Architecture

# SQL (PostgreSQL)
Used for structured, relational data that requires strong consistency and ACID properties. 
- **Normalization**: The data is normalized to the Third Normal Form (3FN) to avoid redundancy.
- **Entities**: Customers, Categories, Suppliers, Products, Orders, and Order Items.

# NoSQL (MongoDB)
Used for audit logging and transaction tracking.
- **Decision**: MongoDB was chosen for audit logs due to its flexible schema, allowing us to store snapshots of deleted items as they were at the time of deletion, regardless of future schema changes in the relational database.
- **Audit Implementation**: Every time a product is deleted via the API, a complete snapshot of its state is saved to the `audit_logs` collection.

# Deployment Instructions (Ubuntu)

## Server Installation Guide

# 1. Update System
```bash
sudo apt update
```

# 2. Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo -u postgres psql -c "CREATE DATABASE db_megastore;"
```

# 3. Install MongoDB
```bash
sudo apt install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

# 4. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

 Database Setup
- Run the schema script: `psql -d db_megastore -f docs/scripts/schema.sql`.

# 3. Install Dependencies
```bash
npm install
```

# 4. Environment Configuration:
   - Create a `.env` file based on the provided template and update your credentials.

# Usage

# 1. Data Migration
Run the idempotent migration script to ingest the actual "legacy" Excel data:
```bash
npm run migrate
```
The script processes `data_excel/data.xlsx` and handles duplicates: if a customer with the same email or a product with the same SKU already exists, it updates their information instead of creating double entries.

# 2. Start the API
```bash
npm start
```

# 3. API Endpoints

# Products (CRUD)
- `GET /api/products`: List all products with their category and supplier names.
- `POST /api/products`: Create a new product.
- `PUT /api/products/:id`: Update an existing product.
- `DELETE /api/products/:id`: Delete a product (triggers a MongoDB audit log).

# Business Intelligence (BI)
- `GET /api/bi/suppliers`: Analysis of top suppliers by volume and inventory value.
- `GET /api/bi/customers/:email/history`: Full purchase history for a specific customer.
- `GET /api/bi/categories/:categoryName/star-products`: Top performing products in a category by revenue.

# Data Model Justification
- **SQL**: Chosen for core business entities where relationships (Foreign Keys) and data integrity are paramount.

# Useful SQL Commands for Verification

# 1. View first 5 products
```bash
sudo -u postgres psql -d db_megastore -c "SELECT * FROM products LIMIT 5;"
```

# 2. General Data Count (Audit)
```bash
sudo -u postgres psql -d db_megastore -c "
SELECT 
  (SELECT COUNT(*) FROM products) as Total_Products,
  (SELECT COUNT(*) FROM customers) as Total_Customers,
  (SELECT COUNT(*) FROM orders) as Total_Orders,
  (SELECT COUNT(*) FROM suppliers) as Total_Suppliers;"
```

# 3. View 5 most recent orders
```bash
sudo -u postgres psql -d db_megastore -c "SELECT * FROM orders ORDER BY order_date DESC LIMIT 5;"


