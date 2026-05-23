import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { serveStatic } from '@hono/node-server/serve-static';

export const app = new Hono();

app.use(
  '*',
  secureHeaders({
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
    },
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
    },
  })
);

app.get('/api/health', (c) => c.json({ ok: true }));

// Static file serving — must be last
app.use('*', serveStatic({ root: './dist' }));
