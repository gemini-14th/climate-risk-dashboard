const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alerts.controller');

router.get('/', alertsController.getAlerts);

module.exports = router;
