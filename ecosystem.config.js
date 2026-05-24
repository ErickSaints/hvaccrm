const path = require('path');

module.exports = {
  apps: [
    {
      name: 'hvaccrm-backend',
      script: 'src/index.ts',
      cwd: 'C:\\Users\\mante\\hvaccrm\\backend',
      interpreter: 'C:\\Program Files\\nodejs\\node.exe',
      interpreter_args: '--import tsx',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: 'hvaccrm-frontend',
      script: 'node_modules/vite/bin/vite.js',
      cwd: 'C:\\Users\\mante\\hvaccrm\\frontend',
      interpreter: 'C:\\Program Files\\nodejs\\node.exe',
      args: '--host',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '500M',
      restart_delay: 3000,
    },
  ],
};
