'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

const DataStorage = require('.')

class DataStorageProvider extends ServiceProvider {
  register() {
    const Redis = this.app.use('Redis')
    this.app.singleton('DataStorage', () => {
      return new DataStorage(Redis)
    })
  }
}

module.exports = DataStorageProvider
