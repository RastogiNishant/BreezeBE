'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class MoveCreditScoresToSchema extends Schema {
  async up() {
    await Database.raw(`INSERT into prospect_credit_scores (member_id, credit_score)
      (SELECT id, credit_score from members where credit_score is not null)
    `)

    await Database.raw(`INSERT into credit_score_proofs (prospect_credit_score_id, url)
      (SELECT prospect_credit_scores.id, members.debt_proof from prospect_credit_scores
        inner join members on members.id=prospect_credit_scores.member_id)
    `)
  }

  down() {}
}

module.exports = MoveCreditScoresToSchema
