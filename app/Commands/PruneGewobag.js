'use strict'

const { Command } = require('@adonisjs/ace')
const ThirdPartyOfferService = require('../Services/ThirdPartyOfferService')

class PruneGebowag extends Command {
  static get signature() {
    return 'prune:gewobag'
  }

  static get description() {
    return 'Manually Pull Gewobag'
  }

  async handle(args, options) {
    await ThirdPartyOfferService.pruneGewobag()
  }
}

module.exports = PruneGebowag
