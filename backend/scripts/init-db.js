const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const databaseName = process.env.DB_NAME || 'eventoplanners_db';

  if (databaseName !== 'eventoplanners_db') {
    throw new Error(
      `DB_NAME must be eventoplanners_db for this frozen project schema. Current value: ${databaseName}`,
    );
  }

  const schemaPath = path.resolve(__dirname, '../../database/schema.sql');

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Database schema file was not found: ${schemaPath}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    await connection.query(schemaSql);

    const [tables] = await connection.query(
      `SELECT TABLE_NAME
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME`,
      [databaseName],
    );

    console.log(`Database initialized: ${databaseName}`);
    console.log('Tables:');

    for (const row of tables) {
      console.log(`- ${row.TABLE_NAME}`);
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Database initialization failed:', error.message);
  process.exit(1);
});
