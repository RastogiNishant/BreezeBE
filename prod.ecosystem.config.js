'use strict'

module.exports = {
  apps: [
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
        name: 'breeze-prod',
      },
      env_development: {
        NODE_ENV: 'development',
        name: 'breeze-development',
      },
      'env_aws-development': {
        NODE_ENV: 'aws-development',
      },
      env_staging: {
        NODE_ENV: 'staging',
        name: 'breeze',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      env_testing: {
        NODE_ENV: 'testing',
      },
    },
  ],
}
