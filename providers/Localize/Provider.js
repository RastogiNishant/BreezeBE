'use strict'

const { ServiceProvider } = require('@adonisjs/fold')
const Localization = require('.')

class LocalizeProvider extends ServiceProvider {
  register() {
    const Config = this.app.use('Adonis/Src/Config')
    const settings = Config.get('app.localize')
    this.app.singleton('Localize', () => {
      return new Localization(settings)
    })
  }
}

module.exports = LocalizeProvider
