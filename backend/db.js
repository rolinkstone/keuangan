// Ganti di file config/db.js
const mysql = require('mysql2/promise'); // Gunakan promise version

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'accounting',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
db.getConnection()
    .then(conn => {
        console.log('MySQL Connected');
        conn.release();
    })
    .catch(err => {
        console.error('Error connecting to MySQL:', err);
    });

module.exports = db;