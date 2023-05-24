'use strict'

const { Command } = require('@adonisjs/ace')
const ThirdPartyOfferService = require('../Services/ThirdPartyOfferService')

class PullOhnemakler extends Command {
  static get signature() {
    return 'pull:ohnemakler'
  }

  static get description() {
    return 'Manually Pull Ohnemakler'
  }

  async handle(args, options) {
    await ThirdPartyOfferService.pullOhneMakler(true)
  }
}

module.exports = PullOhnemakler
