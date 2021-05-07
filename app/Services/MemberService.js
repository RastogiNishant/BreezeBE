const Member = use('App/Models/Member')
const Income = use('App/Models/Income')
const IncomeProof = use('App/Models/IncomeProof')

class MemberService {
  /**
   *
   */
  static async getMembers(userId) {
    const query = Member.query()
      .where('user_id', userId)
      .with('incomes', function (b) {
        b.with('proofs')
      })

    return (await query.fetch()).rows
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
  static async addIncome(data, member) {
    return Income.createItem({
      ...data,
      member_id: member.id,
    })
  }

  /**
   *
   */
  static async getIncomeByIdAndUser(id, user) {
    return Income.query()
      .where('id', id)
      .whereIn('member_id', function () {
        this.select('id').from('members').where('user_id', user.id)
      })
      .first()
  }

  /**
   *
   */
  static async addMemberIncomeProof(data, income) {
    return IncomeProof.createItem({
      ...data,
      income_id: income.id,
    })
  }
}

module.exports = MemberService
