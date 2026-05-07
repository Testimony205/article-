import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    multipleStatements: true
  });

  console.log('Connected to MySQL');

  const dbName = process.env.MYSQL_DATABASE || 'inspirational_articles';
  await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
  await connection.query(`USE ${dbName}`);
  console.log(`Using database ${dbName}`);

  const sqlFile = path.join(process.cwd(), 'scripts', 'setup-database.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  await connection.query(sql);
  console.log('Database schema created successfully');

  await connection.end();
}

run().catch(console.error);
