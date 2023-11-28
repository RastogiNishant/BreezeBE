'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const { ROLE_USER } = require('../../app/constants')

class SyncMemberNameToUsersSchema extends Schema {
  async up() {
    await Database.raw(`
    update users 
      set firstname=_m.firstname, secondname=_m.secondname 
    from (
      select distinct on (members.user_id) user_id, firstname, secondname
      from members
      order by members.user_id
    ) as _m
    where users.id=_m.user_id
    and users.firstname is null
    and users.role=${ROLE_USER} 
    `)
  }

  down() {}
}

module.exports = SyncMemberNameToUsersSchema
