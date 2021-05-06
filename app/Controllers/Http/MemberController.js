const Promise = require('bluebird')

const File = use('App/Classes/File')
const Income = use('App/Models/Income')
const MemberService = use('App/Services/MemberService')
const HttpException = use('App/Exceptions/HttpException')

/**
 * Apply files from request if exists
 */
const mixinFiles = async (request, item) => {
  const logo = request.file('company_logo')
  const file = request.file('file')

  const { logoPath, incomePath } = await Promise.props({
    logoPath: logo
      ? File.saveToDisk(logo, [File.IMAGE_PNG, File.IMAGE_JPG])
      : Promise.resolve(undefined),
    incomePath: file
      ? File.saveToDisk(file, [File.IMAGE_PDF, File.IMAGE_PNG, File.IMAGE_JPG], false)
      : Promise.resolve(undefined),
  })
  if (logoPath) {
    item.company_logo = logoPath
  }
  if (incomePath) {
    item.document = incomePath
  }

  return item
}

/**
 *
 */
const mixinAvatar = async (request, member) => {
  const avatar = request.file('avatar')
  const { avatarPath } = await Promise.props({
    avatarPath: avatar
      ? File.saveToDisk(avatar, [File.IMAGE_PNG, File.IMAGE_JPG])
      : Promise.resolve(undefined),
  })
  if (avatarPath) {
    member.avatar = avatarPath
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
    const member = await mixinAvatar(request, request.all())
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

    const updateData = await mixinAvatar(request, data)
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
    const { id, ...data } = request.all()
    let member = await MemberService.getMemberQuery()
      .where('id', id)
      .where('user_id', auth.user.id)
      .first()

    if (!member) {
      throw new HttpException('Member not exists', 404)
    }

    const incomeData = await mixinFiles(request, data)
    const income = await MemberService.addIncome(incomeData, member)

    response.res(income)
  }

  /**
   *
   */
  async editIncome({ request, auth, response }) {
    const { income_id, id, ...rest } = request.all()
    const income = await Income.query()
      .where('id', income_id)
      .whereIn('member_id', function () {
        this.select('id').from('members').where('user_id', auth.user.id)
      })
      .first()

    if (!income) {
      throw new HttpException('Income not exists', 404)
    }

    const data = await mixinFiles(request, rest)
    await income.updateItem(data)

    response.res(income)
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
