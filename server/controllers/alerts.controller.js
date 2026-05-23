const Alert = require('../models/Alert');

const getAlerts = async (req, res, next) => {
  try {
    const alerts = await Alert.getActive();
    res.json(alerts);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAlerts };
