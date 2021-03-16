'use strict'

const Env = use('Env')

module.exports = {
  connection: Env.get('MAIL_CONNECTION', 'ses'),

  mailAccount: Env.get('SUPPORT_EMAIL'),

  smtp: {
    driver: 'smtp',
    pool: true,
    port: Env.get('SMTP_PORT', 2525),
    host: Env.get('SMTP_HOST'),
    secure: false,
    auth: {
      user: Env.get('MAIL_USERNAME'),
      pass: Env.get('MAIL_PASSWORD'),
    },
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 10,
  },

  mailtrap: {
    driver: 'smtp',
    pool: true,
    port: Env.get('SMTP_PORT', 2525),
    host: Env.get('SMTP_HOST'),
    secure: false,
    auth: {
      user: Env.get('MAIL_USERNAME'),
      pass: Env.get('MAIL_PASSWORD'),
    },
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 10,
  },

  sparkpost: {
    driver: 'sparkpost',
    apiKey: Env.get('SPARKPOST_API_KEY'),
    extras: {},
  },

  mailgun: {
    driver: 'mailgun',
    domain: Env.get('MAILGUN_DOMAIN'),
    region: Env.get('MAILGUN_API_REGION'),
    apiKey: Env.get('MAILGUN_API_KEY'),
    extras: {},
  },

  ethereal: {
    driver: 'ethereal',
  },

  ses: {
    driver: 'ses',
    apiVersion: '2010-12-01',
    accessKeyId: Env.get('SES_KEY'),
    secretAccessKey: Env.get('SES_SECRET'),
    region: Env.get('SES_REGION'),
    rateLimit: 10,
  },
}
