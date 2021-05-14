const Database = use('Database')
const Member = use('App/Models/Member')
const Tenant = use('App/Models/Tenant')
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

  /**
   *
   */
  static async updateUserIncome(userId) {
    await Database.raw(
      `
      UPDATE tenants SET income = (
        SELECT COALESCE(SUM(coalesce(income, 0)), 0)
          FROM members as _m
            INNER JOIN incomes as _i ON _i.member_id = _m.id
          WHERE user_id = ?
      ) WHERE user_id = ?
    `,
      [userId, userId]
    )
  }
}

module.exports = MemberService
