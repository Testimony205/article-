import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';
import path from 'path';
import { hash } from 'bcryptjs';
import { loadEnvFile } from './load-env';
import fs from 'fs';

loadEnvFile();

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

  const [roleColumns] = await connection.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`,
    [dbName]
  );

  if (roleColumns.length === 0) {
    await connection.query(
      `ALTER TABLE users
       ADD COLUMN role ENUM('user','admin') NOT NULL DEFAULT 'user' AFTER name`
    );
    console.log('Added users.role column');
  }

  const articleColumnChecks = [
    { name: 'source_url', sql: `ALTER TABLE articles ADD COLUMN source_url VARCHAR(1000) AFTER image_url` },
    { name: 'source_name', sql: `ALTER TABLE articles ADD COLUMN source_name VARCHAR(255) AFTER source_url` },
    { name: 'imported_at', sql: `ALTER TABLE articles ADD COLUMN imported_at DATETIME AFTER source_name` },
    { name: 'content_quality', sql: `ALTER TABLE articles ADD COLUMN content_quality ENUM('full','preview') NOT NULL DEFAULT 'full' AFTER imported_at` },
  ];

  for (const column of articleColumnChecks) {
    const [columns] = await connection.query<RowDataPacket[]>(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'articles' AND COLUMN_NAME = ?`,
      [dbName, column.name]
    );

    if (columns.length === 0) {
      await connection.query(column.sql);
      console.log(`Added articles.${column.name} column`);
    }
  }

  const [sourceIndexes] = await connection.query<RowDataPacket[]>(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'articles' AND INDEX_NAME = 'idx_source_url'`,
    [dbName]
  );

  if (sourceIndexes.length === 0) {
    await connection.query(`ALTER TABLE articles ADD INDEX idx_source_url (source_url(255))`);
    console.log('Added articles.idx_source_url index');
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Admin';

  if (adminEmail && adminPassword) {
    const hashedPassword = await hash(adminPassword, 10);
    await connection.execute(
      `INSERT INTO users (email, password, name, role, created_at)
       VALUES (?, ?, ?, 'admin', NOW())
       ON DUPLICATE KEY UPDATE
         password = VALUES(password),
         name = VALUES(name),
         role = 'admin'`,
      [adminEmail, hashedPassword, adminName]
    );
    console.log(`Admin account ready: ${adminEmail}`);
  } else {
    console.log('ADMIN_EMAIL and ADMIN_PASSWORD not set; skipped admin account setup');
  }

  await connection.end();
}

run().catch(console.error);
