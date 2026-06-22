module.exports = {
  apps: [
    {
      name: 'smartvest-api',
      script: 'src/app.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3001,
      },
    },
  ],
};
