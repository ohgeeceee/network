import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import pg from 'pg';
import { z } from 'zod';

const { Pool } = pg;
const origins = (process.env.ALLOWED_ORIGINS || 'https://ohgeec.com,https://www.ohgeec.com')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'ohgeec',
  user: process.env.DB_USER || 'intake_api',
  password: process.env.DB_PASSWORD,
  max: 5,
  idleTimeoutMillis: 10_000,
});
const app = Fastify({
  logger: false,
  bodyLimit: 16 * 1024,
  trustProxy: false,
});

const optionalText = (max) => z.string().trim().max(max).optional().default('');
const intakeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: optionalText(32),
  email: z.union([z.string().trim().email().max(254), z.literal('')]).optional().default(''),
  location: optionalText(120),
  preferredContact: z.enum(['phone', 'sms', 'email']),
  requestType: z.string().trim().min(1).max(80).regex(/^[a-z0-9_-]+$/i),
  deviceType: optionalText(120),
  serviceMode: z.enum(['onsite', 'remote', 'undecided']),
  service: z.enum(['virus_malware','setup_optimization','data_recovery','software_help','network_wifi','starlink_setup','tutoring','other']),
  description: z.string().trim().min(3).max(2000),
  requestedDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]).optional().default(''),
  requestedTime: z.union([z.string().regex(/^\d{2}:\d{2}$/), z.literal('')]).optional().default(''),
  sourcePage: z.string().trim().max(240).regex(/^\/(?!\/)[^\r\n]*$/),
  consentToContact: z.literal(true),
  website: optionalText(200),
}).strict();

const normPhone = (value) => {
  const digits = value.replace(/\D/g, '');
  if (!digits.length) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
};
const normEmail = (value) => value ? value.trim().toLowerCase() : null;
const accepted = async (_request, reply) => reply.code(202).send({ accepted: true });

await app.register(cors, {
  origin: (origin, callback) => callback(null, !origin || origins.includes(origin)),
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Idempotency-Key'],
  maxAge: 600,
});
await app.register(rateLimit, {
  max: 12,
  timeWindow: '10 minutes',
  keyGenerator: (request) => request.headers['cf-connecting-ip'] || request.ip,
  errorResponseBuilder: () => ({ error: 'Please wait before trying again.' }),
});

app.get('/healthz', { config: { rateLimit: false } }, async (_request, reply) => {
  try {
    await pool.query('SELECT 1');
    return reply.send({ ok: true });
  } catch {
    return reply.code(503).send({ ok: false });
  }
});

app.post('/v1/intake', async (request, reply) => {
  const key = request.headers['idempotency-key'];
  if (typeof key !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(key)) {
    return reply.code(400).send({ error: 'Request could not be accepted.' });
  }
  const parsed = intakeSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Please check the request fields and try again.' });
  const form = parsed.data;
  if (form.website) return accepted(request, reply);
  if (form.serviceMode === 'onsite' && !form.location) {
    return reply.code(400).send({ error: 'Please add your Montana town or county for an on-site request.' });
  }
  if (form.preferredContact === 'email' && !form.email) {
    return reply.code(400).send({ error: 'Please add the preferred contact detail.' });
  }
  if (form.preferredContact !== 'email' && !form.phone) {
    return reply.code(400).send({ error: 'Please add the preferred contact detail.' });
  }

  const requestedWindow = [form.requestedDate, form.requestedTime].filter(Boolean).join(' ');
  try {
    await pool.query(
      'SELECT create_public_intake($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)',
      [key, form.name, form.phone, form.email, normPhone(form.phone), normEmail(form.email), form.location,
       form.preferredContact, form.service, form.deviceType, form.serviceMode, requestedWindow,
       form.description, form.requestType, form.sourcePage],
    );
    return reply.code(202).send({ accepted: true });
  } catch {
    // Do not log customer payloads or database error details.
    return reply.code(503).send({ error: 'Request could not be saved right now. Please try again later.' });
  }
});

app.setNotFoundHandler((_request, reply) => reply.code(404).send({ error: 'Not found.' }));
app.setErrorHandler((error, _request, reply) => {
  const status = Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 500
    ? error.statusCode : 400;
  const message = status === 429 ? 'Please wait before trying again.' : 'Request could not be accepted.';
  return reply.code(status).send({ error: message });
});

const port = Number(process.env.PORT || 3000);
await app.listen({ host: '0.0.0.0', port });

const shutdown = async () => {
  await app.close();
  await pool.end();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
