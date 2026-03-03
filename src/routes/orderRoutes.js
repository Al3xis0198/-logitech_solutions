const express = require('express');
const router = express.Router();
const db = require('../config/db');


router.post('/', async (req, res) => {
    const { customer_id, items } = req.body;

    if (!customer_id || !items || items.length === 0) {
        return res.status(400).json({ error: 'customer_id and items are required' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        let total = 0;

        for (const item of items) {
            const productRes = await client.query(
                'SELECT id, name, price, stock FROM products WHERE id = $1 FOR UPDATE',
                [item.product_id]
            );
            if (productRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: `Product ${item.product_id} not found` });
            }
            const product = productRes.rows[0];
            if (product.stock < item.quantity) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: `Insufficient stock for "${product.name}". Available: ${product.stock}` });
            }
            item.unit_price = product.price;
            total += product.price * item.quantity;
        }

        const orderId = `TXN-${Date.now()}`;
        const orderRes = await client.query(
            'INSERT INTO orders (id, customer_id, total_amount) VALUES ($1, $2, $3) RETURNING *',
            [orderId, customer_id, total]
        );

        for (const item of items) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
                [orderId, item.product_id, item.quantity, item.unit_price]
            );
            await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ order: orderRes.rows[0], total });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Order error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
