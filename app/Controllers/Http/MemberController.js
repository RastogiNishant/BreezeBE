const Promise = require('bluebird')

const File = use('App/Classes/File')
const Income = use('App/Models/Income')
const MemberService = use('App/Services/MemberService')
const HttpException = use('App/Exceptions/HttpException')

/**
 * Apply files from request if exists
 */
const mixinFiles = async (request, member) => {
  const avatar = request.file('avatar')
  const companyLogo = request.file('company_logo')

  const { avatarPath, companyLogoPath } = await Promise.props({
    avatarPath: avatar
      ? File.saveToDisk(avatar, [File.IMAGE_PNG, File.IMAGE_JPG])
      : Promise.resolve(undefined),
    companyLogoPath: companyLogo
      ? File.saveToDisk(companyLogo, [File.IMAGE_PNG, File.IMAGE_JPG])
      : Promise.resolve(undefined),
  })
  if (avatarPath) {
    member.avatar = avatarPath
  }
  if (companyLogoPath) {
    member.company_logo = companyLogoPath
  }

  return member
}

/**
 *
 */
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
    const member = await mixinFiles(request, request.all())
    const result = await MemberService.createMember(member, auth.user.id)

    response.res(result)
  }

  /**
   *
   */
  async updateMember({ request, auth, response }) {
    const { id, ...data } = request.all()
    const member = await MemberService.getMemberQuery()
      .where('id', id)
      .where('user_id', auth.user.id)
      .first()

    if (!member) {
      throw HttpException('Member not exists', 404)
    }

    const updateData = await mixinFiles(request, data)
    await member.updateItem(updateData)

    response.res(member)
  }

  /**
   *
   */
  async removeMember({ request, auth, response }) {
    const { id } = request.all()
    await MemberService.getMemberQuery().where('id', id).where('user_id', auth.user.id).delete()

    response.res(true)
  }

  /**
   *
   */
  async addMemberIncome({ request, auth, response }) {
    const income = request.file('income')
    const { id } = request.all()
    const member = await MemberService.getMemberQuery()
      .where('id', id)
      .where('user_id', auth.user.id)
      .first()

    if (!member) {
      throw new HttpException('Member not exists', 404)
    }

    const incomePath = await File.saveToDisk(income, [File.IMAGE_PDF], false)
    await MemberService.addIncome(incomePath, member)

    response.res(true)
  }

  /**
   *
   */
  async removeMemberIncome({ request, auth, response }) {
    const { income_id } = request.all()
    await Income.query()
      .where('id', income_id)
      .whereIn('member_id', function () {
        this.select('id').from('members').where('user_id', auth.user.id)
      })
      .delete()

    response.res(true)
  }
}

module.exports = MemberController
