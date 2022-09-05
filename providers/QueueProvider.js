'use strict'

const { ServiceProvider } = require('@adonisjs/fold')
const { get } = require('lodash')

const Queue = require('../app/Classes/Queue')

class QueueProvider extends ServiceProvider {
  register() {
    const Config = this.app.use('Adonis/Src/Config')
    const Event = this.app.use('Event')
    const settings = get(Config.get('redis'), Config.get('redis.connection'))
    this.app.singleton('Queue', () => {
      return new Queue(settings, Event)
    })
  }
}

module.exports = QueueProvider
