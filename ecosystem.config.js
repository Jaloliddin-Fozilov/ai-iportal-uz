module.exports = {
  apps: [
    {
      name: 'ai-iportal-uz',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3050',
      cwd: '/var/www/ai.iportal.uz',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3050,
      },
    },
  ],
};
