const mysql = require('mysql2/promise');

const isProduction = process.env.NODE_ENV === 'production';

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306', 10),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'climate_dashboard',
  // Railway and most cloud MySQL providers require SSL in production
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('MySQL connected successfully.');
    conn.release();
  })
  .catch(err => {
    console.error('MySQL connection failed:', err.message);
    console.error('Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT in your .env file.');
  });

module.exports = pool;
