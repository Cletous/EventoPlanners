const mysql = require('mysql2/promise');

async function main() {
  const databaseName = process.env.DB_NAME || 'eventoplanners_db';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: databaseName,
  });

  try {
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'poll_url'`,
      [databaseName],
    );

    if (columns.length === 0) {
      await connection.execute(
        `ALTER TABLE payments
         ADD COLUMN poll_url VARCHAR(1000) NULL AFTER paynow_reference`,
      );
      console.log('Added payments.poll_url.');
    } else {
      console.log('payments.poll_url already exists.');
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Paynow poll URL migration failed:', error.message);
  process.exit(1);
});
