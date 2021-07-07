'use strict'

const { Command } = require('@adonisjs/ace')
const P = require('bluebird')

const Estate = use('App/Models/Estate')
const MatchService = use('App/Services/MatchService')

const { STATUS_ACTIVE } = require('../constants')

class Recalc extends Command {
  static get signature() {
    return 'app:match_estates'
  }

  static get description() {
    return 'Run match recalculation for all active estates'
  }

  async handle(args, options) {
    const estates = await Estate.query().where({ status: STATUS_ACTIVE }).orderBy('id').fetch()
    await P.map(
      estates.rows,
      (e) => {
        console.log(e.id)
        return MatchService.matchByEstate(e.id)
      },
      { concurrency: 1 }
    )
  }
}

module.exports = Recalc
