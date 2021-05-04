const MemberService = use('App/Services/MemberService')

class MemberController {
  /**
   *
   */
  async getMembers({ request, auth, response }) {
    const members = await MemberService.getMembers(auth.user.id)

    response.res(members)
  }

  /**
   *
   */
  async addMember({ request, auth, response }) {
    response.res(true)
  }

  /**
   *
   */
  async updateMember({ request, auth, response }) {
    response.res(true)
  }

  /**
   *
   */
  async removeMember({ request, auth, response }) {
    response.res(true)
  }

  /**
   *
   */
  async addMemberIncome({ request, auth, response }) {
    response.res(true)
  }

  /**
   *
   */
  async removeMemberIncome({ request, auth, response }) {
    response.res(true)
  }
}

module.exports = MemberController
