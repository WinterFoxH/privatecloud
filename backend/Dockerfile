# PrivateCloud backend — multi-stage (native deps: better-sqlite3, bcrypt)
# better-sqlite3@13 requires Node >= 22
# node:22-bookworm includes python3/make/g++ for native rebuilds if prebuilds miss
FROM node:22-bookworm AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# foreground-scripts: stream install output (avoids "stuck after deprecation warn" look)
# Prefer prebuilds; fall back to compile tools already on bookworm
RUN npm ci --omit=dev --no-fund --no-audit --foreground-scripts \
  && node -e "require('bcrypt'); require('better-sqlite3'); console.log('native modules ok')"

FROM node:22-bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends libstdc++6 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/db/cloud.db
ENV STORAGE_ROOT=/data/storage

EXPOSE 3000

CMD ["node", "src/index.js"]
