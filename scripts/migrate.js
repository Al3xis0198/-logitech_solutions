const path = require('path');
const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const upsert = async (query, params) => (await pool.query(query, params)).rows[0].id;

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(path.join(__dirname, '../data_excel/data.xlsx'));
        const worksheet = workbook.getWorksheet(1);

        const results = [];
        const headers = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber] = cell.value;
        });

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const rowData = {};
            row.eachCell((cell, colNumber) => {
                rowData[headers[colNumber]] = cell.value;
            });
            results.push(rowData);
        });

        console.log(`Migrating ${results.length} rows...`);
        for (const r of results) {
            const cId = await upsert('INSERT INTO customers (name, email, address) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, address=EXCLUDED.address RETURNING id', [r.customer_name, r.customer_email, r.customer_address]);
            const catId = await upsert('INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id', [r.product_category]);
            const sId = await upsert('INSERT INTO suppliers (name, contact) VALUES ($1, $2) ON CONFLICT (contact) DO UPDATE SET name=EXCLUDED.name RETURNING id', [r.supplier_name, r.supplier_email]);
            const pId = await upsert('INSERT INTO products (sku, name, price, category_id, supplier_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (sku) DO UPDATE SET name=EXCLUDED.name, price=EXCLUDED.price, category_id=EXCLUDED.category_id, supplier_id=EXCLUDED.supplier_id RETURNING id', [r.product_sku, r.product_name, r.unit_price, catId, sId]);

            const o = await pool.query('INSERT INTO orders (id, customer_id, order_date, total_amount) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING RETURNING id', [r.transaction_id, cId, r.date, r.unit_price * r.quantity]);
            if (o.rows[0]) await pool.query('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)', [o.rows[0].id, pId, r.quantity, r.unit_price]);
        }
        console.log('Migration OK');
        process.exit(0);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}
migrate();
