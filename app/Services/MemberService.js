const Member = use('App/Models/Member')
const Income = use('App/Models/Income')

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

  /**
   *
   */
  static getMemberQuery() {
    return Member.query()
  }

  /**
   *
   */
  static async addIncome(filePath, member) {
    return Income.createItem({
      url: filePath,
      disc: 's3',
      member_id: member.id,
    })
  }
}

module.exports = MemberService
