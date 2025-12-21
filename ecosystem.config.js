module.exports = {
  apps: [
    {
      name: 'skyscraping-api',
      cwd: '/home/konstantin/skyscraping',
      script: 'app/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_PATH: '/home/konstantin/skyscraping/node_modules',
        PGHOST: '127.0.0.1',
        PGPORT: 5434,
        PGUSER: 'appuser',
        PGPASSWORD: 'apppass',
        PGDATABASE: 'appdb',
        DATABASE_URL: 'postgresql://appuser:apppass@127.0.0.1:5434/appdb',
        FRONTEND_ORIGIN: 'http://159.89.30.87:3001',
        INGEST_INTERVAL_MS: 300000,
        INGEST_LIMIT: 20,
        INGEST_CONCURRENCY: 5,
        JWT_SECRET: 'change-this-to-a-long-random-secret'
      }
    },
    {
      name: 'skyscraping-web',
      cwd: '/home/konstantin/skyscraping/frontend',
      script: '.next/standalone/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        NEXT_PUBLIC_BACKEND_URL: 'http://159.89.30.87:3000',
        BACKEND_URL: 'http://127.0.0.1:3000',
        HOST: '0.0.0.0'
      }
    }
  ]
};