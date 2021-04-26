'use strict'

const { Command } = require('@adonisjs/ace')

class ClearCache extends Command {
  static get signature() {
    return 'app:clear'
  }

  static get description() {
    return 'Clear app cache'
  }

  async handle(args, options) {
    const Cache = use('Cache')
    await Cache.tags(['cache']).flush()
    process.exit(0)
  }
}

module.exports = ClearCache
