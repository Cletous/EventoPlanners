const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

function getArgument(name) {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length).trim() : '';
}

async function main() {
  const name = getArgument('name');
  const email = getArgument('email').toLowerCase();
  const password = getArgument('password');

  if (!name || !email || !password) {
    console.error(
      'Usage: npm run seed:admin -- --name="Administrator" --email="admin@example.com" --password="YourPassword"',
    );
    process.exit(1);
  }

  if (password.length < 8 || password.length > 72) {
    console.error('Admin password must be between 8 and 72 characters.');
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eventoplanners_db',
  });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email],
    );

    if (existing.length > 0) {
      await connection.execute(
        `UPDATE users
         SET name = ?, password_hash = ?, role = 'admin', updated_at = NOW()
         WHERE id = ?`,
        [name, passwordHash, existing[0].id],
      );
      console.log(`Updated admin account: ${email}`);
    } else {
      await connection.execute(
        `INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
         VALUES (?, ?, ?, 'admin', NOW(), NOW())`,
        [name, email, passwordHash],
      );
      console.log(`Created admin account: ${email}`);
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Unable to create admin account:', error.message);
  process.exit(1);
});
