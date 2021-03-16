'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

module.exports = {
  authenticator: 'jwt',

  session: {
    serializer: 'lucid',
    model: 'App/Models/User',
    scheme: 'session',
    uid: 'username',
    password: 'password',
  },

  basic: {
    serializer: 'lucid',
    model: 'App/Models/User',
    scheme: 'basic',
    uid: 'username',
    password: 'password',
  },

  jwt: {
    serializer: 'lucid',
    model: 'App/Models/User',
    scheme: 'jwt',
    uid: 'username',
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
    uid: 'username',
    password: 'password',
    options: {
      secret: Env.get('ADMIN_APP_KEY'),
      expiresIn: 7200, // 2 Hours lifetime
    },
  },

  // api: {
  //   serializer: 'lucid',
  //   model: 'App/Models/User',
  //   scheme: 'api',
  //   uid: 'username',
  //   password: 'password',
  // },
}
