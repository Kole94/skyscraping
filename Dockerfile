FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies first (better layer caching)
COPY package.json ./
# If you later add a lockfile, prefer: COPY package*.json ./
RUN npm install --only=production

# Copy application code
COPY app ./app

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "app/server.js"]


