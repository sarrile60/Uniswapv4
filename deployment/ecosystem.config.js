module.exports = {
  apps: [
    {
      name: 'zenthos-backend',
      cwd: '/opt/zenthos/backend',
      interpreter: '/opt/zenthos/backend/venv/bin/python3',
      script: '/opt/zenthos/backend/venv/bin/uvicorn',
      args: 'server:app --host 0.0.0.0 --port 8001 --workers 2',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 10,
      restart_delay: 3000,
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/opt/zenthos/logs/backend-error.log',
      out_file: '/opt/zenthos/logs/backend-out.log',
    },
  ],
};
