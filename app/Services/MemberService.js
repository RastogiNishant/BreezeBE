const Member = use('App/Models/Member')

class MemberService {
  /**
   *
   */
  static async getMembers(userId) {
    return (await Member.query().where('user_id', userId).fetch()).rows
  }

  /**
   *
   */
  static async createMember(member, user_id) {
    return Member.createItem({ ...member, user_id })
  }
}

module.exports = MemberService
