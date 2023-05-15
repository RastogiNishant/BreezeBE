'use strict'

const { Command } = require('@adonisjs/ace')
const ThirdPartyOfferService = require('../Services/ThirdPartyOfferService')

class PullGebowag extends Command {
  static get signature() {
    return 'pull:gewobag'
  }

  static get description() {
    return 'Manually Pull Gewobag'
  }

  async handle(args, options) {
    await ThirdPartyOfferService.pullGewobag()
  }
}

module.exports = PullGebowag
