FROM node:20-alpine AS deps
WORKDIR /usr/src/app
# Copy package manifest(s) (lockfile if present) for deterministic installs
COPY package*.json ./
# Prefer ci; fallback to install if lockfile is absent
RUN (npm ci --no-audit --no-fund) || npm install

FROM node:20-alpine AS builder
WORKDIR /usr/src/app
# Keep NODE_ENV unset here so devDependencies required for build are available
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
EXPOSE 3001
# Only copy necessary files to run
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/package.json ./package.json
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3001"]


