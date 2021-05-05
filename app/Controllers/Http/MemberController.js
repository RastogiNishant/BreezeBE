const MemberService = use('App/Services/MemberService')
const File = use('App/Classes/File')
const Promise = require('bluebird')

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
    const avatar = request.file('avatar')
    const companyLogo = request.file('company_logo')
    const member = request.all()

    const { avatarPath, companyLogoPath } = await Promise.props({
      avatarPath: avatar
        ? File.saveToDisk(avatar, [File.IMAGE_PNG, File.IMAGE_JPG])
        : Promise.resolve(undefined),
      companyLogoPath: companyLogo
        ? File.saveToDisk(companyLogo, [File.IMAGE_PNG, File.IMAGE_JPG])
        : Promise.resolve(undefined),
    })

    member.avatar = avatarPath
    member.company_logo = companyLogoPath

    const result = await MemberService.createMember(member, auth.user.id)

    response.res(result)
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
