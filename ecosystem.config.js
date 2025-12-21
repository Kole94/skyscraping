module.exports = {
  apps: [
    {
      name: 'skyscraping-api',
      cwd: '/home/konstantin/skyscraping',
      script: 'app/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Ensure Node resolves local project modules
        NODE_PATH: '/home/konstantin/skyscraping/node_modules',
        // Postgres (DB container exposed on host 5434)
        PGHOST: '127.0.0.1',
        PGPORT: 5434,
        PGUSER: 'appuser',
        PGPASSWORD: 'apppass',
        PGDATABASE: 'appdb',
        DATABASE_URL: 'postgresql://appuser:apppass@127.0.0.1:5434/appdb',
        // CORS: must match your frontend origin exactly
        FRONTEND_ORIGIN: 'http://159.89.30.87:3001',
        // Ingest scheduler
        INGEST_INTERVAL_MS: 300000,
        INGEST_LIMIT: 20,
        INGEST_CONCURRENCY: 5,
        // Replace in production
        JWT_SECRET: 'change-this-to-a-long-random-secret'
      }
    },
    {
      name: 'skyscraping-web',
      cwd: '/home/konstantin/skyscraping/frontend',
      // Run the built Next app on 3001 using standalone build
      script: '.next/standalone/server.js',
      args: '-p 3001',
      env: {
        NODE_ENV: 'production',
        // Browser calls the API at the backend (public)
        NEXT_PUBLIC_BACKEND_URL: 'http://159.89.30.87:3000',
        // Server-side fetches inside Next
        BACKEND_URL: 'http://127.0.0.1:3000',
        HOST: '0.0.0.0'
      }
    }
  ]
};


