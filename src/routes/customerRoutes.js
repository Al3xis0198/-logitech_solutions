const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM customers ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { name, email, address } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email are required' });
    try {
        const result = await db.query(
            'INSERT INTO customers (name, email, address) VALUES ($1, $2, $3) RETURNING *',
            [name, email, address || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
