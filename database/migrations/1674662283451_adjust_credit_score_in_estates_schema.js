'use strict'

const { STATUS_DELETE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')

class AdjustCreditScoreInEstatesSchema extends Schema {
  async up() {
    const estates =
      (
        await Estate.query()
          .where(function () {
            this.orWhere('credit_score', '<=', 1)
            this.orWhere('budget', '<', 1)
          })
          .fetch()
      ).toJSON() || []

    let i = 0
    while (i < estates.length) {
      const credit_score =
        estates[i].credit_score >= 1 ? estates[i].credit_score : estates[i].credit_score * 100
      const budget = estates[i].budget >= 1 ? estates[i].budget : estates[i].budget * 100
      await Estate.query().where('id', estates[i].id).update({ budget, credit_score })
      i++
    }
  }

  down() {}
}

module.exports = AdjustCreditScoreInEstatesSchema
