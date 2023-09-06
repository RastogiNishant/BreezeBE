'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class PopulateCreditScoreProofsMembersSchema extends Schema {
  async up() {
    await Database.raw(
      `UPDATE members set debt_proof = ARRAY[debt_proof_2] where debt_proof_2 is not null`
    )
  }

  down() {}
}

module.exports = PopulateCreditScoreProofsMembersSchema
