module.exports = {
  apps: [
    {
      name: 'uniswapv4-backend',
      cwd: '/opt/uniswapv4/backend',
      interpreter: '/opt/uniswapv4/backend/venv/bin/python3',
      script: '/opt/uniswapv4/backend/venv/bin/uvicorn',
      args: 'server:app --host 0.0.0.0 --port 8001 --workers 2',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 10,
      restart_delay: 3000,
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/opt/uniswapv4/logs/backend-error.log',
      out_file: '/opt/uniswapv4/logs/backend-out.log',
    },
  ],
};
