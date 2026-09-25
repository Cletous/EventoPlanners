import crypto from 'crypto';

const PAYNOW_INIT_URL = 'https://www.paynow.co.zw/interface/initiatetransaction';

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

export function getPaynowConfig() {
  return {
    integrationId: requiredEnv('PAYNOW_INTEGRATION_ID'),
    integrationKey: requiredEnv('PAYNOW_INTEGRATION_KEY'),
    integrationEmail: requiredEnv('PAYNOW_INTEGRATION_EMAIL'),
    resultUrl: requiredEnv('PAYNOW_RESULT_URL'),
    returnUrl: requiredEnv('PAYNOW_RETURN_URL'),
  };
}

export function buildPaynowReturnUrl(reference) {
  const { returnUrl } = getPaynowConfig();
  const url = new URL(returnUrl);
  url.searchParams.set('reference', reference);
  return url.toString();
}

export function generatePaynowHash(values, integrationKey) {
  const joined = values.join('') + integrationKey;
  return crypto.createHash('sha512').update(joined, 'utf8').digest('hex').toUpperCase();
}

export function parsePaynowMessage(rawBody) {
  const params = new URLSearchParams(String(rawBody || '').trim());
  const entries = [];
  const data = {};

  for (const [key, value] of params.entries()) {
    const normalizedKey = key.toLowerCase();
    entries.push([normalizedKey, value]);
    data[normalizedKey] = value;
  }

  return { entries, data };
}

export function verifyPaynowMessage(entries, integrationKey) {
  const suppliedHash = entries.find(([key]) => key === 'hash')?.[1];
  if (!suppliedHash) return false;

  const values = entries
    .filter(([key]) => key !== 'hash')
    .map(([, value]) => value);

  const generatedHash = generatePaynowHash(values, integrationKey);
  const supplied = String(suppliedHash).trim().toUpperCase();

  if (!/^[0-9A-F]{128}$/.test(supplied)) return false;

  const expected = Buffer.from(generatedHash, 'utf8');
  const actual = Buffer.from(supplied, 'utf8');

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function paynowErrorMessage(data) {
  const error = String(data?.error || '').trim();
  return error
    ? `Paynow rejected the transaction: ${error}`
    : 'Paynow could not initiate the transaction.';
}

export async function initiatePaynowTransaction({ reference, amount, title }) {
  const config = getPaynowConfig();
  const returnUrl = buildPaynowReturnUrl(reference);
  const amountText = Number(amount).toFixed(2);

  const fields = [
    ['id', config.integrationId],
    ['reference', reference],
    ['amount', amountText],
    ['additionalinfo', `EventoPlanners registration: ${title}`],
    ['returnurl', returnUrl],
    ['resulturl', config.resultUrl],
    // In Paynow test mode, authemail must match a login email on the
    // merchant account that owns the integration. The attendee email stays
    // in EventoPlanners; Paynow authentication uses this configured email.
    ['authemail', config.integrationEmail],
    ['status', 'Message'],
  ];

  const hash = generatePaynowHash(fields.map(([, value]) => value), config.integrationKey);
  const body = new URLSearchParams([...fields, ['hash', hash]]);

  const response = await fetch(PAYNOW_INIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    cache: 'no-store',
  });

  const rawResponse = await response.text();
  const parsed = parsePaynowMessage(rawResponse);
  const status = String(parsed.data.status || '').trim().toLowerCase();

  if (!response.ok) {
    throw new Error(`Paynow returned HTTP ${response.status}.`);
  }

  // Paynow documents unsuccessful initiate responses as Status=Error&Error=...
  // and those responses may not contain a hash. Surface that real message first
  // instead of misreporting it as a response-hash failure.
  if (status === 'error') {
    throw new Error(paynowErrorMessage(parsed.data));
  }

  // Successful responses must still be authenticated before using browserurl.
  if (!verifyPaynowMessage(parsed.entries, config.integrationKey)) {
    throw new Error('Paynow response hash validation failed. Check the Paynow integration key and response integrity.');
  }

  if (status !== 'ok' || !parsed.data.browserurl) {
    throw new Error(paynowErrorMessage(parsed.data));
  }

  return {
    redirectUrl: parsed.data.browserurl,
    paynowReference: parsed.data.paynowreference || null,
    pollUrl: parsed.data.pollurl || null,
  };
}

export function mapPaynowStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();

  if (['paid', 'awaiting delivery', 'delivered'].includes(normalized)) {
    return 'paid';
  }

  if (['cancelled', 'disputed', 'refunded', 'failed', 'error'].includes(normalized)) {
    return 'failed';
  }

  return 'pending';
}
