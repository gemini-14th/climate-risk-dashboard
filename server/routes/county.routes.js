const express = require('express');
const router  = express.Router();
const { getCountyDetail } = require('../controllers/county.controller');

router.get('/:name', getCountyDetail);
module.exports = router;
