'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const Member = use('App/Models/Member')

class AdjustMemberMainProfileProspectSchema extends Schema {
  async up() {
    const users = await Database.raw(
      `select u.id, u.firstname, u.secondname, u.email, owner_id, u.status, u.created_at from users u left join members m on u.id = m.user_id where u."role" = 3 and u.owner_id is null and m.id is null`
    )
    let i = 0

    if (!users?.rows?.length) {
      return
    }

    while (i < users?.rows?.length) {
      const user = users.rows[i]
      await Member.createItem({
        user_id: user.id,
        firstname: user.firstname,
        secondname: user.secondname,
        is_verified: true,
      })
      i++
    }
  }

  down() {}
}

module.exports = AdjustMemberMainProfileProspectSchema
