module.exports = {
  apps: [
    {
      name: 'iportal-ai',
      script: 'npm',
      args: 'start -- -p 3000',
      cwd: '/var/www/ai-iportal-uz', // yoki VDS-dagi loyiha yo'li
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
