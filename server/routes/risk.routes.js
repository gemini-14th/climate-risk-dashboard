const express = require('express');
const router = express.Router();
const riskController = require('../controllers/risk.controller');

router.get('/', riskController.getRiskData);

module.exports = router;
