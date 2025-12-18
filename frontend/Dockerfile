FROM node:20-alpine AS deps
WORKDIR /usr/src/app
COPY package.json ./
# If you add a lockfile later, prefer copying it and using ci for deterministic installs
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
# Only copy necessary files to run
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/package.json ./package.json
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3001"]


