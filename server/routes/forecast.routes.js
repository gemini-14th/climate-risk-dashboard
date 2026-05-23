const express = require('express');
const router = express.Router();
const forecastController = require('../controllers/forecast.controller');

router.get('/', forecastController.getForecast);

module.exports = router;
