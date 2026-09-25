import { parseEventId, validateEventPayload } from '../lib/event-validation';

const validEvent = {
  title: 'UZ Tech Conference',
  description: 'A software engineering event.',
  venue: 'University of Zimbabwe',
  event_date: '2026-10-20',
  start_time: '09:30',
  registration_fee: 15,
  capacity: 200,
  status: 'published',
  image_url: '',
};

describe('event validation', () => {
  test('accepts a valid complete event and normalizes values', () => {
    const result = validateEventPayload(validEvent);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.data).toMatchObject({
      title: 'UZ Tech Conference',
      start_time: '09:30:00',
      registration_fee: 15,
      capacity: 200,
      status: 'published',
      image_url: null,
    });
  });

  test.each([
    [0, 'Capacity must be between 1 and 500.'],
    [501, 'Capacity must be between 1 and 500.'],
    [3.5, 'Capacity must be a whole number.'],
  ])('rejects invalid capacity %s', (capacity, message) => {
    const result = validateEventPayload({ ...validEvent, capacity });

    expect(result.valid).toBe(false);
    expect(result.errors.capacity).toBe(message);
  });

  test.each([
    [-0.01, 'Registration fee must be between 0 and 1000.'],
    [1000.01, 'Registration fee must be between 0 and 1000.'],
    ['not-a-number', 'Registration fee must be a number.'],
  ])('rejects invalid registration fee %s', (registrationFee, message) => {
    const result = validateEventPayload({ ...validEvent, registration_fee: registrationFee });

    expect(result.valid).toBe(false);
    expect(result.errors.registration_fee).toBe(message);
  });

  test('rejects an impossible calendar date', () => {
    const result = validateEventPayload({ ...validEvent, event_date: '2026-02-30' });

    expect(result.valid).toBe(false);
    expect(result.errors.event_date).toBe('Event date must be a valid date.');
  });

  test('rejects an invalid event status', () => {
    const result = validateEventPayload({ ...validEvent, status: 'archived' });

    expect(result.valid).toBe(false);
    expect(result.errors.status).toBe('Status must be draft, published, or closed.');
  });

  test('supports partial updates and rejects an empty update', () => {
    const good = validateEventPayload({ title: 'Updated title' }, { partial: true });
    const empty = validateEventPayload({}, { partial: true });

    expect(good.valid).toBe(true);
    expect(good.data).toEqual({ title: 'Updated title' });
    expect(empty.valid).toBe(false);
    expect(empty.errors.general).toBe('Provide at least one event field to update.');
  });
});

describe('parseEventId', () => {
  test.each(['1', 2, '999'])('accepts positive safe integer IDs: %s', (value) => {
    expect(parseEventId(value)).toBe(Number(value));
  });

  test.each([0, -1, 'abc', 1.2, '', null])('rejects invalid IDs: %s', (value) => {
    expect(parseEventId(value)).toBeNull();
  });
});
