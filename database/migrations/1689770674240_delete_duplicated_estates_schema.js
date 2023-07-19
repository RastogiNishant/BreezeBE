'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const ThirdPartyMatch = use('App/Models/ThirdPartyMatch')
const { groupBy } = require('lodash')

class DeleteDuplicatedEstatesSchema extends Schema {
  async up() {
    try {
      const duplicatedMatches =
        await Database.raw(`select tpm.id, tpm.user_id, tpm.estate_id, tpm.status from third_party_matches tpm 
    inner join ( SELECT user_id , estate_id, COUNT(*) as count
      FROM third_party_matches  
      GROUP BY user_id , estate_id 
      HAVING COUNT(*) > 1 ) tmp 
     on tpm.user_id = tmp.user_id and tpm.estate_id = tmp.estate_id
     order by id `)

      const groupMatches = groupBy(
        duplicatedMatches.rows,
        (match) => `${match.user_id}_${match.estate_id}`
      )

      const toDeleteMatchIds = Object.keys(groupMatches || {}).map((key) => groupMatches[key][0].id)
      await ThirdPartyMatch.query().whereIn('id', toDeleteMatchIds).delete()
    } catch (e) {
      console.log('DeleteDuplicatedEstatesSchema error', e.message)
    }
  }

  down() {
    this.table('delete_duplicated_estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = DeleteDuplicatedEstatesSchema
