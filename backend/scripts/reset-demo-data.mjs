import bcrypt from 'bcrypt';
import pool from '../lib/db.js';

const ADMIN_PASSWORD = 'Pass@123';
const ATTENDEE_PASSWORD = 'Pass@123';
const SALT_ROUNDS = 10;

const attendees = Array.from({ length: 25 }, (_, index) => {
  const letter = String.fromCharCode('a'.charCodeAt(0) + index);
  return {
    name: `Demo Attendee ${letter.toUpperCase()}`,
    email: `user${letter}@example.com`,
  };
});

const admins = [
  { name: 'Demo Admin One', email: 'admin1@example.com' },
  { name: 'Demo Admin Two', email: 'admin2@example.com' },
  { name: 'Demo Admin Three', email: 'admin3@example.com' },
];

const events = [
  {
    title: 'Published Free Community Tech Meetup',
    description: 'A free community event for students to discover practical software testing techniques.',
    venue: 'University of Zimbabwe Main Hall',
    event_date: '2026-10-05',
    start_time: '09:00:00',
    registration_fee: 0,
    capacity: 120,
    status: 'published',
  },
  {
    title: 'Published Paid QA Workshop',
    description: 'A practical quality assurance workshop covering test planning, test design and automation.',
    venue: 'Innovation Hub Lab 2',
    event_date: '2026-10-08',
    start_time: '10:00:00',
    registration_fee: 15,
    capacity: 60,
    status: 'published',
  },
  {
    title: 'Published Cybersecurity Awareness Seminar',
    description: 'A security awareness seminar covering authentication, authorization and common web risks.',
    venue: 'Engineering Lecture Theatre',
    event_date: '2026-10-12',
    start_time: '14:00:00',
    registration_fee: 5,
    capacity: 80,
    status: 'published',
  },
  {
    title: 'Published Student Innovation Expo',
    description: 'A public showcase of student technology projects and software engineering prototypes.',
    venue: 'UZ Great Hall',
    event_date: '2026-10-18',
    start_time: '08:30:00',
    registration_fee: 0,
    capacity: 200,
    status: 'published',
  },
  {
    title: 'Published Database Design Clinic',
    description: 'Hands-on support session for database normalization, constraints and testing data integrity.',
    venue: 'Computer Science Lab 1',
    event_date: '2026-10-22',
    start_time: '11:00:00',
    registration_fee: 10,
    capacity: 45,
    status: 'published',
  },
  {
    title: 'Draft AI in Education Roundtable',
    description: 'A planned roundtable discussion on the responsible use of AI in education.',
    venue: 'Seminar Room B',
    event_date: '2026-11-02',
    start_time: '13:00:00',
    registration_fee: 0,
    capacity: 40,
    status: 'draft',
  },
  {
    title: 'Draft Mobile App Testing Bootcamp',
    description: 'Draft training event for mobile usability and regression testing.',
    venue: 'Lab 3',
    event_date: '2026-11-05',
    start_time: '09:30:00',
    registration_fee: 20,
    capacity: 50,
    status: 'draft',
  },
  {
    title: 'Draft DevOps and CI Seminar',
    description: 'A planned session about continuous integration, automated tests and deployment quality gates.',
    venue: 'Engineering Boardroom',
    event_date: '2026-11-11',
    start_time: '15:00:00',
    registration_fee: 0,
    capacity: 70,
    status: 'draft',
  },
  {
    title: 'Closed Requirements Review Clinic',
    description: 'A completed requirements review event retained for reporting and closed-event testing.',
    venue: 'Room C12',
    event_date: '2026-09-15',
    start_time: '10:00:00',
    registration_fee: 0,
    capacity: 35,
    status: 'closed',
  },
  {
    title: 'Closed Software Metrics Briefing',
    description: 'A closed briefing on software quality metrics and dashboards.',
    venue: 'Room D4',
    event_date: '2026-09-20',
    start_time: '12:00:00',
    registration_fee: 8,
    capacity: 30,
    status: 'closed',
  },
  {
    title: 'Closed Legacy Systems Talk',
    description: 'A closed talk used to demonstrate non-registerable events.',
    venue: 'Auditorium 2',
    event_date: '2026-09-24',
    start_time: '16:00:00',
    registration_fee: 5,
    capacity: 25,
    status: 'closed',
  },
  {
    title: 'Closed Event Management Retrospective',
    description: 'A closed event used for dashboard and reporting sample data.',
    venue: 'Conference Room A',
    event_date: '2026-09-28',
    start_time: '09:00:00',
    registration_fee: 0,
    capacity: 40,
    status: 'closed',
  },
];

const pad = (value) => String(value).padStart(3, '0');

async function insertUser(connection, user, role, passwordHash) {
  const [result] = await connection.execute(
    `INSERT INTO users (name, email, password_hash, role, must_change_password, deleted_at)
     VALUES (?, ?, ?, ?, 0, NULL)`,
    [user.name, user.email, passwordHash, role],
  );
  return result.insertId;
}

async function insertRegistration(connection, userId, eventId, status) {
  const [result] = await connection.execute(
    `INSERT INTO registrations (user_id, event_id, status)
     VALUES (?, ?, ?)`,
    [userId, eventId, status],
  );
  return result.insertId;
}

async function insertPayment(connection, registrationId, amount, status, method, index, confirmedBy = null) {
  const reference = `DEMO-${method.toUpperCase()}-${pad(index)}`;
  const externalReference = method === 'paynow' ? `PN-${pad(index)}` : `BANK-${pad(index)}`;
  const confirmedAt = status === 'paid' ? '2026-09-29 08:30:00' : null;
  const notes = method === 'paynow'
    ? 'Demo Paynow payment record.'
    : 'Demo offline payment seeded for presentation and testing.';

  await connection.execute(
    `INSERT INTO payments (
       registration_id, payment_method, amount, reference, paynow_reference,
       external_reference, confirmation_notes, poll_url, status, confirmed_by, confirmed_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      registrationId,
      method,
      amount,
      reference,
      method === 'paynow' ? externalReference : null,
      method === 'paynow' ? null : externalReference,
      notes,
      method === 'paynow' && status === 'pending' ? `https://paynow.example/demo/${reference}` : null,
      status,
      confirmedBy,
      confirmedAt,
    ],
  );
}

async function main() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('TRUNCATE TABLE payments');
    await connection.execute('TRUNCATE TABLE registrations');
    await connection.execute('TRUNCATE TABLE events');
    await connection.execute('TRUNCATE TABLE users');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    const attendeePasswordHash = await bcrypt.hash(ATTENDEE_PASSWORD, SALT_ROUNDS);

    const adminIds = [];
    for (const admin of admins) {
      adminIds.push(await insertUser(connection, admin, 'admin', adminPasswordHash));
    }

    const attendeeIds = [];
    for (const attendee of attendees) {
      attendeeIds.push(await insertUser(connection, attendee, 'user', attendeePasswordHash));
    }

    const eventRecords = [];
    for (const event of events) {
      const [result] = await connection.execute(
        `INSERT INTO events (
           title, description, venue, event_date, start_time,
           registration_fee, capacity, status, image_url
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          event.title,
          event.description,
          event.venue,
          event.event_date,
          event.start_time,
          event.registration_fee,
          event.capacity,
          event.status,
        ],
      );
      eventRecords.push({ ...event, id: result.insertId });
    }

    let paymentIndex = 1;
    const registrationPlan = [
      { attendee: 0, event: 0, status: 'confirmed' },
      { attendee: 1, event: 0, status: 'confirmed' },
      { attendee: 2, event: 1, status: 'pending_payment', payment: 'paynow_pending' },
      { attendee: 3, event: 1, status: 'confirmed', payment: 'paynow_paid' },
      { attendee: 4, event: 1, status: 'confirmed', payment: 'manual_paid' },
      { attendee: 5, event: 2, status: 'pending_payment', payment: 'paynow_failed' },
      { attendee: 6, event: 2, status: 'confirmed', payment: 'bank_paid' },
      { attendee: 7, event: 3, status: 'confirmed' },
      { attendee: 8, event: 3, status: 'cancelled' },
      { attendee: 9, event: 4, status: 'pending_payment', payment: 'paynow_pending' },
      { attendee: 10, event: 4, status: 'confirmed', payment: 'bank_paid' },
      { attendee: 11, event: 8, status: 'confirmed' },
      { attendee: 12, event: 9, status: 'confirmed', payment: 'manual_paid' },
      { attendee: 13, event: 10, status: 'cancelled' },
      { attendee: 14, event: 11, status: 'confirmed' },
    ];

    for (const item of registrationPlan) {
      const event = eventRecords[item.event];
      const registrationId = await insertRegistration(
        connection,
        attendeeIds[item.attendee],
        event.id,
        item.status,
      );

      if (item.payment) {
        const [method, statusName] = item.payment.split('_');
        const paymentMethod = method === 'bank' ? 'bank_transfer' : method;
        const paymentStatus = statusName === 'paid' ? 'paid' : statusName;
        await insertPayment(
          connection,
          registrationId,
          event.registration_fee,
          paymentStatus,
          paymentMethod,
          paymentIndex,
          paymentStatus === 'paid' && paymentMethod !== 'paynow' ? adminIds[0] : null,
        );
        paymentIndex += 1;
      }
    }

    await connection.commit();

    console.log('Demo database reset complete.');
    console.log('Seeded 3 admins: admin1@example.com, admin2@example.com, admin3@example.com');
    console.log('Seeded 25 attendees: usera@example.com through usery@example.com');
    console.log('All seeded users use password: Pass@123');
    console.log('Seeded 12 events across draft, published and closed statuses.');
    console.log('Seeded registrations and payments across confirmed, pending_payment, cancelled, paynow, bank_transfer and manual states.');
  } catch (error) {
    await connection.rollback();
    try { await connection.execute('SET FOREIGN_KEY_CHECKS = 1'); } catch {}
    console.error('Demo database reset failed:', error);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

main();
