'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

module.exports = {
  authenticator: 'jwt',

  jwt: {
    serializer: 'lucid',
    model: 'App/Models/User',
    scheme: 'jwt',
    uid: 'uid',
    password: 'password',
    options: {
      secret: Env.get('APP_KEY'),
      expiresIn: 2592000, // 30 days lifetime
    },
  },

  jwtAdmin: {
    serializer: 'lucid',
    model: 'App/Models/User',
    scheme: 'jwt',
    uid: 'uid',
    password: 'password',
    options: {
      secret: Env.get('ADMIN_APP_KEY'),
      expiresIn: 7200, // 2 Hours lifetime
    },
  },
}
