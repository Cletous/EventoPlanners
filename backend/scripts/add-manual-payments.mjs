import mysql from 'mysql2/promise';

const database = process.env.DB_NAME;
if (!database) throw new Error('DB_NAME is required.');

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database,
});

async function columnExists(name) {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'payments' AND COLUMN_NAME = ? LIMIT 1`,
    [database, name],
  );
  return rows.length > 0;
}

async function indexExists(name) {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'payments' AND INDEX_NAME = ? LIMIT 1`,
    [database, name],
  );
  return rows.length > 0;
}

async function constraintExists(name) {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = 'payments' AND CONSTRAINT_NAME = ? LIMIT 1`,
    [database, name],
  );
  return rows.length > 0;
}

try {
  const columns = [
    ['payment_method', "ALTER TABLE payments ADD COLUMN payment_method ENUM('paynow', 'bank_transfer', 'manual') NOT NULL DEFAULT 'paynow' AFTER registration_id"],
    ['external_reference', 'ALTER TABLE payments ADD COLUMN external_reference VARCHAR(150) NULL AFTER paynow_reference'],
    ['confirmation_notes', 'ALTER TABLE payments ADD COLUMN confirmation_notes VARCHAR(500) NULL AFTER external_reference'],
    ['confirmed_by', 'ALTER TABLE payments ADD COLUMN confirmed_by BIGINT UNSIGNED NULL AFTER status'],
    ['confirmed_at', 'ALTER TABLE payments ADD COLUMN confirmed_at DATETIME NULL AFTER confirmed_by'],
  ];

  for (const [name, sql] of columns) {
    if (await columnExists(name)) {
      console.log(`payments.${name} already exists`);
    } else {
      await connection.execute(sql);
      console.log(`Added payments.${name}`);
    }
  }

  for (const [name, sql] of [
    ['idx_payments_method', 'ALTER TABLE payments ADD KEY idx_payments_method (payment_method)'],
    ['idx_payments_confirmed_by', 'ALTER TABLE payments ADD KEY idx_payments_confirmed_by (confirmed_by)'],
  ]) {
    if (await indexExists(name)) console.log(`${name} already exists`);
    else {
      await connection.execute(sql);
      console.log(`Added ${name}`);
    }
  }

  if (await constraintExists('fk_payments_confirmed_by')) {
    console.log('fk_payments_confirmed_by already exists');
  } else {
    await connection.execute(
      `ALTER TABLE payments
       ADD CONSTRAINT fk_payments_confirmed_by
       FOREIGN KEY (confirmed_by) REFERENCES users(id)
       ON UPDATE CASCADE ON DELETE SET NULL`,
    );
    console.log('Added fk_payments_confirmed_by');
  }

  console.log('Manual-payment migration is up to date.');
} finally {
  await connection.end();
}
