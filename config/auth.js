'use strict'
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
      secret: `${Env.get('APP_KEY')}-user`,
      expiresIn: 2592000, // 30 days lifetime
    },
  },

  jwtLandlord: {
    serializer: 'lucid',
    model: 'App/Models/User',
    scheme: 'jwt',
    uid: 'uid',
    password: 'password',
    options: {
      secret: `${Env.get('APP_KEY')}-landlord`,
      expiresIn: 2592000, // 30 days lifetime
    },
  },
  jwtPropertyManager: {
    serializer: 'lucid',
    model: 'App/Models/User',
    scheme: 'jwt',
    uid: 'uid',
    password: 'password',
    options: {
      secret: Env.get('PROPERTY_MANAGER_APP_KEY'),
      expiresIn: 2592000, // 30 days lifetime
    },
  },

  jwtHousekeeper: {
    serializer: 'lucid',
    model: 'App/Models/User',
    scheme: 'jwt',
    uid: 'uid',
    password: 'password',
    options: {
      secret: Env.get('HOUSEKEEPER_APP_KEY'),
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
  jwtAdministrator: {
    serializer: 'lucid',
    model: 'App/Models/Admin',
    scheme: 'jwt',
    uid: 'uid',
    password: 'password',
    options: {
      secret: Env.get('ADMIN_APP_KEY'),
      expiresIn: 3 * 24 * 60 * 60,
    },
  },
}
