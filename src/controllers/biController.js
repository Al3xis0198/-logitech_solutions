const db = require('../config/db');
const q = (sql, params) => async (req, res) => {
    try {
        const p = params ? params(req) : [];
        console.log(`[Query] ${sql.substring(0, 50)}... Params: ${JSON.stringify(p)}`);
        const result = await db.query(sql, p);
        res.json(result.rows);
    } catch (err) {
        console.error('Database Error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getSupplierAnalysis = q(`
    SELECT s.name as supplier_name, SUM(oi.quantity) as total_items, SUM(oi.quantity * p.price) as total_inventory_value 
    FROM suppliers s 
    JOIN products p ON s.id=p.supplier_id 
    JOIN order_items oi ON p.id=oi.product_id 
    GROUP BY s.id, s.name 
    ORDER BY total_items DESC
`);

exports.getCustomerHistory = q(`
    SELECT o.id, o.order_date, p.name, oi.quantity, oi.unit_price, (oi.quantity * oi.unit_price) as total 
    FROM customers c 
    JOIN orders o ON c.id=o.customer_id 
    JOIN order_items oi ON o.id=oi.order_id 
    JOIN products p ON oi.product_id=p.id 
    WHERE c.email=$1 
    ORDER BY o.order_date DESC
`, r => [r.params.email]);

exports.getAllCustomers = q(`SELECT * FROM customers ORDER BY name ASC`);

exports.getStarProducts = q(`
    SELECT p.name as product_name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price) as total_revenue 
    FROM products p 
    JOIN order_items oi ON p.id=oi.product_id 
    JOIN categories c ON p.category_id=c.id 
    WHERE c.name=$1 
    GROUP BY p.id, p.name 
    ORDER BY total_revenue DESC
`, r => [r.params.categoryName]);
