const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const productRoutes = require('./routes/productRoutes');
const biRoutes = require('./routes/biRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');
require('dotenv').config({ quiet: true });

const app = express();
const PORT = 3001;
const path = require('path');

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval'; img-src * data:; font-src *;");
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

const publicPath = path.resolve(__dirname, '../public');
app.use('/api/products', productRoutes);
app.use('/api/bi', biRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);

app.use(express.static(publicPath));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
