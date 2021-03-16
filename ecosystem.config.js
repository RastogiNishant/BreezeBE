'use strict'

module.exports = {
  apps: [
    // Prod instance
    {
      name: 'breeze-prod',
      script: './server.js',
      instances: 1,
      min_uptime: 4000,
      restart_delay: 2000,
      max_restarts: 10,
      merge_logs: true,
      watch: false,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
    // Dev instance
    {
      name: 'breeze-development',
      script: './server.js',
      instances: 1,
      min_uptime: 4000,
      restart_delay: 2000,
      max_restarts: 10,
      merge_logs: true,
      watch: false,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
      },
    },
    // Staging instance
    {
      name: 'breeze-staging',
      script: './server.js',
      instances: 1,
      min_uptime: 4000,
      restart_delay: 2000,
      max_restarts: 10,
      merge_logs: true,
      watch: false,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'staging',
      },
    },
  ],
}
