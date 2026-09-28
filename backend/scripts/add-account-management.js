const mysql = require('mysql2/promise');

async function columnExists(connection, table, column) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS total
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [process.env.DB_NAME || 'eventoplanners_db', table, column],
  );
  return Number(rows[0].total) > 0;
}

async function indexExists(connection, table, indexName) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS total
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [process.env.DB_NAME || 'eventoplanners_db', table, indexName],
  );
  return Number(rows[0].total) > 0;
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eventoplanners_db',
  });

  try {
    if (!(await columnExists(connection, 'users', 'must_change_password'))) {
      await connection.query(
        'ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER role',
      );
      console.log('Added users.must_change_password');
    }

    if (!(await columnExists(connection, 'users', 'deleted_at'))) {
      await connection.query(
        'ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL AFTER updated_at',
      );
      console.log('Added users.deleted_at');
    }

    if (!(await indexExists(connection, 'users', 'idx_users_deleted_at'))) {
      await connection.query('ALTER TABLE users ADD KEY idx_users_deleted_at (deleted_at)');
      console.log('Added idx_users_deleted_at');
    }

    console.log('Account-management migration is up to date.');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Account-management migration failed:', error.message);
  process.exit(1);
});
