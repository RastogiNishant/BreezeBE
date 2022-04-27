'use strict'

const Schema = use('Schema')
const Member = use('App/Models/Member')
const MemberPermission = use('App/Models/MemberPermission')
const User = use('App/Models/User')

class DeleteOldUnnecessaryMembers extends Schema {
  async up() {
    // Each user can have 1 member as per new feature.
    // We should delete multiple members of the users
    const users = await User.query().fetch()
    for (let i = 0; i < users.rows.length; i++) {
      const user = users.rows[i]
      const members = await Member.query()
        .select('id')
        .where({ owner_user_id: null, email: null, user_id: user.id })
        .orderBy('created_at', 'asc')
        .orderBy('id', 'asc')
        .fetch()

      if (members.rows.length > 1) {
        for (let i = 1; i < members.rows.length; i++) {
          const member_id = members.rows[i].id
          await MemberPermission.query().where({ member_id }).delete()
          await Member.query().where('id', member_id).delete()
        }
      }
    }
  }
}

module.exports = DeleteOldUnnecessaryMembers
