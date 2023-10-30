'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

const Notifications = require('.')

class NotificationsProvider extends ServiceProvider {
  register() {
    const Config = this.app.use('Adonis/Src/Config')
    const settings = Config.get('app.firebase')
    this.app.singleton('Notifications', () => {
      return new Notifications(settings)
    })
  }
}

module.exports = NotificationsProvider
