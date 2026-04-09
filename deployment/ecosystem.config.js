module.exports = {
  apps: [
    {
      name: 'zenthos-backend',
      cwd: '/opt/zenthos/backend',
      script: 'venv/bin/uvicorn',
      args: 'server:app --host 0.0.0.0 --port 8001',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 10,
      restart_delay: 3000,
    },
    {
      name: 'zenthos-frontend',
      cwd: '/opt/zenthos/frontend',
      script: 'npx',
      args: 'serve -s build -l 3000',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
