const Member = use('App/Models/Member')

class MemberService {
  /**
   *
   */
  static async getMembers(userId) {
    return (await Member.query().where('user_id', userId).fetch()).rows
  }
}

module.exports = MemberService
