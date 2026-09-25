import mysql from 'mysql2/promise';

const requiredEnvironmentVariables = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_NAME',
];

for (const variableName of requiredEnvironmentVariables) {
  if (!process.env[variableName]) {
    throw new Error(`Missing required environment variable: ${variableName}`);
  }
}

const databasePort = Number(process.env.DB_PORT);

if (!Number.isInteger(databasePort) || databasePort <= 0) {
  throw new Error('DB_PORT must be a valid positive integer.');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: databasePort,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
