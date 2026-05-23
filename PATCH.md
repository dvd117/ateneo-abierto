# Silent-Death Fix for TypeScript Services

## What's happening

Your Node.js containers are dying without restarting. The symptoms:
- Service works after a fresh deploy
- Stops responding silently after a while
- Reloading the deployment in Dokploy brings it back

The root cause is one or more of these:

1. **No restart policy** — Docker doesn't restart crashed containers unless told to
2. **No HEALTHCHECK** — Docker (and Traefik) can't tell the process is dead if the container is still "running"
3. **Unhandled rejections/exceptions** — Node.js exits on uncaught errors without making the crash visible to Docker

## Fix for each existing project

### 1. docker-compose.yml — add restart policy

In every service that runs a TypeScript/Node.js process:

```yaml
services:
  app:
    restart: unless-stopped   # ← add this
```

### 2. Dockerfile — add HEALTHCHECK

The service must expose a health endpoint (e.g. `GET /health` → `200 OK`).

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:PORT/health || exit 1
```

Replace `PORT` with the actual port. Use `wget` (available in Alpine) not `curl`.

### 3. Server entry point — register crash handlers

In your server's entry file (before `app.listen()` or `serve()`):

```typescript
process.on('uncaughtException', (err) => {
  console.error('[fatal] uncaughtException', err);
  process.exit(1);   // ← makes the crash visible to Docker → triggers restart
});

process.on('unhandledRejection', (reason) => {
  console.error('[fatal] unhandledRejection', reason);
  process.exit(1);
});
```

Without `process.exit(1)`, some crashes leave Node in a broken state where it appears running but handles nothing. Calling `exit(1)` makes Docker see the crash immediately and apply the restart policy.

### 4. Health endpoint

Every service needs one. Minimal example (Express):

```typescript
app.get('/health', (_req, res) => res.json({ ok: true }));
```

Minimal example (Hono):

```typescript
app.get('/health', (c) => c.json({ ok: true }));
```

## Verification

After applying all three fixes and redeploying:

```bash
# Check restart policy
docker inspect <container-name> | grep -A3 RestartPolicy

# Check health status (should be "healthy" after 30–90s)
docker ps --format "table {{.Names}}\t{{.Status}}"
```

You should see `(healthy)` next to the container in `docker ps`.
