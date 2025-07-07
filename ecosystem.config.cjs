module.exports = {
  apps: [
    {
      name: 'timecraft-frontend',
      script: 'npm',
      args: 'run dev -- --host 0.0.0.0 --port 5173',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 5173
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/frontend-err.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    },
    {
      name: 'timecraft-backend',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    }
  ]
};
