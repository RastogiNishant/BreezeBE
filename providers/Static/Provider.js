'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

const Static = require('./index.js')

class StaticProvider extends ServiceProvider {
  register() {
    // const Config = this.app.use('Adonis/Src/Config')
    // const Env = this.app.use('Env')
    const Database = this.app.use('Database')
    this.app.singleton('Static', () => new Static(Database))
  }

  boot() {}
}

module.exports = StaticProvider
