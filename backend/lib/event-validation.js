const EVENT_STATUSES = ['draft', 'published', 'closed'];

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function normalizeTime(value) {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || '00');

  if (hours > 23 || minutes > 59 || seconds > 59) return null;

  return `${match[1]}:${match[2]}:${String(seconds).padStart(2, '0')}`;
}

export function validateEventPayload(body, { partial = false } = {}) {
  const errors = {};
  const data = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(body || {}, key);
  const requireField = (key) => !partial || has(key);

  if (requireField('title')) {
    const title = String(body?.title ?? '').trim();
    if (!title) errors.title = 'Title is required.';
    else if (title.length > 150) errors.title = 'Title must not exceed 150 characters.';
    else data.title = title;
  }

  if (requireField('description')) {
    const description = String(body?.description ?? '').trim();
    if (!description) errors.description = 'Description is required.';
    else data.description = description;
  }

  if (requireField('venue')) {
    const venue = String(body?.venue ?? '').trim();
    if (!venue) errors.venue = 'Venue is required.';
    else if (venue.length > 255) errors.venue = 'Venue must not exceed 255 characters.';
    else data.venue = venue;
  }

  if (requireField('event_date')) {
    const eventDate = String(body?.event_date ?? '').trim();
    if (!eventDate) errors.event_date = 'Event date is required.';
    else if (!isValidDate(eventDate)) errors.event_date = 'Event date must be a valid date.';
    else data.event_date = eventDate;
  }

  if (requireField('start_time')) {
    const startTime = String(body?.start_time ?? '').trim();
    const normalizedTime = normalizeTime(startTime);
    if (!startTime) errors.start_time = 'Start time is required.';
    else if (!normalizedTime) errors.start_time = 'Start time must be a valid time.';
    else data.start_time = normalizedTime;
  }

  if (requireField('registration_fee')) {
    const registrationFee = Number(body?.registration_fee);
    if (!Number.isFinite(registrationFee)) errors.registration_fee = 'Registration fee must be a number.';
    else if (registrationFee < 0 || registrationFee > 1000) errors.registration_fee = 'Registration fee must be between 0 and 1000.';
    else data.registration_fee = Number(registrationFee.toFixed(2));
  }

  if (requireField('capacity')) {
    const capacity = Number(body?.capacity);
    if (!Number.isInteger(capacity)) errors.capacity = 'Capacity must be a whole number.';
    else if (capacity < 1 || capacity > 500) errors.capacity = 'Capacity must be between 1 and 500.';
    else data.capacity = capacity;
  }

  if (requireField('status')) {
    const status = String(body?.status ?? '').trim();
    if (!EVENT_STATUSES.includes(status)) errors.status = 'Status must be draft, published, or closed.';
    else data.status = status;
  } else if (!partial) {
    data.status = 'draft';
  }

  if (requireField('image_url')) {
    const imageUrl = String(body?.image_url ?? '').trim();
    if (imageUrl.length > 500) errors.image_url = 'Image URL must not exceed 500 characters.';
    else data.image_url = imageUrl || null;
  }

  if (partial && Object.keys(data).length === 0 && Object.keys(errors).length === 0) {
    errors.general = 'Provide at least one event field to update.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data,
  };
}

export function parseEventId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
