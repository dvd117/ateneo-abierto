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
COPY --chown=app:app src/server.ts src/app.ts src/mailerlite.ts ./src/

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node_modules/.bin/tsx", "src/server.ts"]
