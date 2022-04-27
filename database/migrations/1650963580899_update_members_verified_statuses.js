'use strict'

const Schema = use('Schema')

class NewIncomeTypes extends Schema {
  up() {
    this.raw(`
      UPDATE members set is_verified = true WHERE ((owner_user_id IS NULL and email IS NULL) or (owner_user_id IS NOT NULL and email IS NOT NULL)) AND is_verified = false
    `)
  }
}

module.exports = NewIncomeTypes
