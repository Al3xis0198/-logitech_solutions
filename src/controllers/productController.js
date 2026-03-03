const db = require('../config/db');
const AuditLog = require('../models/AuditLog');

const handle = (fn) => (req, res) => fn(req, res).catch(e => res.status(500).json({ error: e.message }));

exports.getProducts = handle(async (req, res) => res.json((await db.query('SELECT p.*, c.name as category_name, s.name as supplier_name FROM products p JOIN categories c ON p.category_id = c.id JOIN suppliers s ON p.supplier_id = s.id ORDER BY p.name ASC')).rows));
exports.createProduct = handle(async (req, res) => {
    const { sku, name, price, category_id, supplier_id, stock } = req.body;
    res.status(201).json((await db.query('INSERT INTO products (sku, name, price, category_id, supplier_id, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [sku, name, price, category_id, supplier_id, stock || 0])).rows[0]);
});
exports.updateProduct = handle(async (req, res) => {
    const { name, price, category_id, supplier_id } = req.body;
    res.json((await db.query('UPDATE products SET name=$1, price=$2, category_id=$3, supplier_id=$4 WHERE id=$5 RETURNING *', [name, price, category_id, supplier_id, req.params.id])).rows[0] || { error: 'Not found' });
});
exports.deleteProduct = handle(async (req, res) => {
    const { rows } = await db.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    await new AuditLog({ entity_type: 'Product', entity_id: req.params.id, action: 'DELETE', previous_data: rows[0] }).save();
    res.json({ message: 'Deleted' });
});
