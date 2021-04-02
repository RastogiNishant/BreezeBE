'use strict'

const Helpers = use('Helpers')
const Env = use('Env')

const path = require('path')

module.exports = {
  default: 'local',

  disks: {
    local: {
      root: path.resolve(Helpers.publicPath(), './uploads'),
      driver: 'local',
    },

    s3: {
      driver: 's3',
      key: Env.get('S3_KEY'),
      secret: Env.get('S3_SECRET'),
      bucket: Env.get('S3_BUCKET'),
      region: Env.get('S3_REGION'),
    },

    s3public: {
      driver: 's3',
      key: Env.get('S3_KEY'),
      secret: Env.get('S3_SECRET'),
      bucket: Env.get('S3_PUBLIC_BUCKET'),
      region: Env.get('S3_REGION'),
    },
  },
}
