'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

const DataStorage = require('.')

class DummyStorage {
  // TODO: check valid class
}

class DataStorageProvider extends ServiceProvider {
  register() {
    const Helpers = this.app.use('Helpers')
    if (Helpers.isAceCommand()) {
      this.app.singleton('DataStorage', () => {
        return new DummyStorage()
      })
    }

    const Redis = this.app.use('Redis')
    this.app.singleton('DataStorage', () => {
      return new DataStorage(Redis)
    })
  }
}

module.exports = DataStorageProvider
