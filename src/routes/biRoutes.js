const express = require('express');
const router = express.Router();
const biController = require('../controllers/biController');

router.get('/suppliers', biController.getSupplierAnalysis);
router.get('/customers', biController.getAllCustomers);
router.get('/customers/:email/history', biController.getCustomerHistory);
router.get('/categories/:categoryName/star-products', biController.getStarProducts);

module.exports = router;
