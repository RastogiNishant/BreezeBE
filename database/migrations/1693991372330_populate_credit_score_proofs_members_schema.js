'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class PopulateCreditScoreProofsMembersSchema extends Schema {
  async up() {
    await Database.raw(
      `UPDATE members set credit_score_proofs = ARRAY[debt_proof] where debt_proof is not null`
    )
  }

  down() {}
}

module.exports = PopulateCreditScoreProofsMembersSchema
