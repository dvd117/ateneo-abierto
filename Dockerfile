# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: runtime ────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

# Non-root user
RUN addgroup -S app && adduser -S -G app app

COPY --chown=app:app package*.json ./
RUN npm ci --omit=dev

# Copy built frontend assets and server source
COPY --chown=app:app --from=build /app/dist ./dist
COPY --chown=app:app src/server.ts src/app.ts src/mailerlite.ts src/client-ip.ts src/rate-limit.ts ./src/

USER app

EXPOSE 3000

# An address, not a name: the check then depends on nothing but the socket.
# `localhost` also works here — node-server passes no hostname to listen(), so
# Node takes the dual-stack wildcard and answers on both loopbacks — but that
# is a property of this server, not of the healthcheck, and a container that
# fails this one is dropped from Traefik's backend pool entirely.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node_modules/.bin/tsx", "src/server.ts"]
