'use strict'

const { ServiceProvider } = require('@adonisjs/fold')
const { OAuth2Client } = require('google-auth-library')

class GoogleOAuthProvider extends ServiceProvider {
  register() {
    const Config = this.app.use('Adonis/Src/Config')
    const { clientId } = 'abc'//Config.get('services.ally.google')
    this.app.singleton('GoogleAuth', () => {
      return new OAuth2Client(clientId)
    })
  }
}

module.exports = GoogleOAuthProvider
