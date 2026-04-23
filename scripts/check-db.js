require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const dbName = (process.env.DB_NAME || 'roommie').replace(/[^a-zA-Z0-9_]/g, '');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await connection.end();

  console.log(`[OK] Database is ready: ${dbName}`);
}

main().catch(err => {
  const detail = err.message || err.code || 'Unknown database error';
  console.error(`[ERROR] Database setup failed: ${detail}`);
  process.exit(1);
});
