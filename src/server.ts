import { serve } from '@hono/node-server';
import { app } from './app';

process.on('uncaughtException', (err) => {
  console.error('[fatal] uncaughtException', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[fatal] unhandledRejection', reason);
  process.exit(1);
});

const REQUIRED_ENV = ['MAILERLITE_API_KEY', 'MAILERLITE_GROUP_ES_ID', 'MAILERLITE_GROUP_EN_ID'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[fatal] missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const rawPort = process.env.PORT ?? '3000';
const port = parseInt(rawPort, 10);
if (!Number.isFinite(port) || port < 1 || port > 65535) {
  console.error(`[fatal] invalid PORT: ${rawPort}`);
  process.exit(1);
}

serve({ fetch: app.fetch, port }, () => {
  console.log(`[server] listening on port ${port}`);
});
