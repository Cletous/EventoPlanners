const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eventoplanners_db',
  });

  try {
    await connection.beginTransaction();

    const [userRows] = await connection.execute(
      "SELECT id FROM users WHERE email LIKE 'e2e.%@example.test'",
    );
    const [eventRows] = await connection.execute(
      "SELECT id FROM events WHERE title LIKE 'E2E %'",
    );

    const userIds = userRows.map((row) => Number(row.id)).filter(Boolean);
    const eventIds = eventRows.map((row) => Number(row.id)).filter(Boolean);

    const registrationConditions = [];
    const registrationValues = [];
    if (userIds.length) {
      registrationConditions.push(`user_id IN (${userIds.map(() => '?').join(',')})`);
      registrationValues.push(...userIds);
    }
    if (eventIds.length) {
      registrationConditions.push(`event_id IN (${eventIds.map(() => '?').join(',')})`);
      registrationValues.push(...eventIds);
    }

    let registrationIds = [];
    if (registrationConditions.length) {
      const [registrationRows] = await connection.execute(
        `SELECT id FROM registrations WHERE ${registrationConditions.join(' OR ')}`,
        registrationValues,
      );
      registrationIds = registrationRows.map((row) => Number(row.id)).filter(Boolean);
    }

    if (registrationIds.length) {
      const placeholders = registrationIds.map(() => '?').join(',');
      await connection.execute(`DELETE FROM payments WHERE registration_id IN (${placeholders})`, registrationIds);
      await connection.execute(`DELETE FROM registrations WHERE id IN (${placeholders})`, registrationIds);
    }

    if (eventIds.length) {
      const placeholders = eventIds.map(() => '?').join(',');
      await connection.execute(`DELETE FROM events WHERE id IN (${placeholders})`, eventIds);
    }

    if (userIds.length) {
      const placeholders = userIds.map(() => '?').join(',');
      await connection.execute(`UPDATE payments SET confirmed_by = NULL WHERE confirmed_by IN (${placeholders})`, userIds);
      await connection.execute(`DELETE FROM users WHERE id IN (${placeholders})`, userIds);
    }

    await connection.commit();
    console.log(`E2E cleanup complete: ${userIds.length} users, ${eventIds.length} events, ${registrationIds.length} registrations.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Unable to clean E2E test data:', error.message);
  process.exit(1);
});
