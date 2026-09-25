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
  const params = new URLSearchParams(rawBody);
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
  const expected = Buffer.from(generatedHash, 'utf8');
  const actual = Buffer.from(String(suppliedHash).toUpperCase(), 'utf8');

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export async function initiatePaynowTransaction({ reference, amount, title, email }) {
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
    ['authemail', email],
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

  if (!response.ok) {
    throw new Error(`Paynow returned HTTP ${response.status}.`);
  }

  if (!verifyPaynowMessage(parsed.entries, config.integrationKey)) {
    throw new Error('Paynow response hash validation failed.');
  }

  const status = parsed.data.status?.toLowerCase();
  if (status !== 'ok' || !parsed.data.browserurl) {
    throw new Error(parsed.data.error || 'Paynow could not initiate the transaction.');
  }

  return {
    redirectUrl: parsed.data.browserurl,
    paynowReference: parsed.data.paynowreference || null,
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
