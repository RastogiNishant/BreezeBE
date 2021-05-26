const File = use('App/Classes/File')
const Income = use('App/Models/Income')
const IncomeProof = use('App/Models/IncomeProof')
const MemberService = use('App/Services/MemberService')
const HttpException = use('App/Exceptions/HttpException')

const imageMimes = [File.IMAGE_JPG, File.IMAGE_PNG]
const docMimes = [File.IMAGE_JPG, File.IMAGE_PNG, File.IMAGE_PDF]

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
    const data = request.all()
    const files = await File.saveRequestFiles(request, [
      { field: 'avatar', mime: imageMimes, isPublic: true },
      { field: 'rent_arrears_doc', mime: docMimes, isPublic: false },
      { field: 'debt_proof', mime: docMimes, isPublic: false },
    ])
    const result = await MemberService.createMember({ ...data, ...files }, auth.user.id)
    await MemberService.calcTenantMemberData(auth.user.id)

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

    const files = await File.saveRequestFiles(request, [
      { field: 'avatar', mime: imageMimes, isPublic: true },
      { field: 'rent_arrears_doc', mime: docMimes, isPublic: false },
      { field: 'debt_proof', mime: docMimes, isPublic: false },
    ])
    await member.updateItem({ ...data, ...files })
    await MemberService.calcTenantMemberData(auth.user.id)

    response.res(member)
  }

  /**
   *
   */
  async removeMember({ request, auth, response }) {
    const { id } = request.all()
    await MemberService.getMemberQuery().where('id', id).where('user_id', auth.user.id).delete()
    await MemberService.calcTenantMemberData(auth.user.id)

    response.res(true)
  }

  /**
   *
   */
  async removeMemberDocs({ request, auth, response }) {
    const { id, field } = request.all()
    const member = await MemberService.getMemberQuery()
      .where('id', id)
      .where('user_id', auth.user.id)
      .first()
    if (!member) {
      throw new HttpException('Invalid member', 400)
    }

    if (!member[field]) {
      return response.res(false)
    }

    await File.remove(member[field], false)
    member[field] = null
    await member.save()
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
    const files = await File.saveRequestFiles(request, [
      { field: 'company_logo', mime: imageMimes, isPublic: true },
    ])

    const income = await MemberService.addIncome({ ...data, ...files }, member)
    await MemberService.updateUserIncome(auth.user.id)

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
    const files = await File.saveRequestFiles(request, [
      { field: 'company_logo', mime: imageMimes, isPublic: true },
    ])

    await income.updateItem({ ...rest, ...files })
    await MemberService.updateUserIncome(auth.user.id)

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

  /**
   *
   */
  async addMemberIncomeProof({ request, auth, response }) {
    const { income_id, ...rest } = request.all()

    const income = await MemberService.getIncomeByIdAndUser(income_id, auth.user)
    if (!income) {
      throw new HttpException('Invalid income', 404)
    }

    const files = await File.saveRequestFiles(request, [
      { field: 'file', mime: docMimes, isPublic: false },
    ])
    const incomeProof = await MemberService.addMemberIncomeProof({ ...rest, ...files }, income)

    response.res(incomeProof)
  }

  /**
   *
   */
  async removeMemberIncomeProof({ request, auth, response }) {
    const { id } = request.all()

    // get proof
    const proof = await IncomeProof.query()
      .select('income_proofs.*')
      .innerJoin({ _i: 'incomes' }, '_i.id', 'income_proofs.income_id')
      .innerJoin({ _m: 'members' }, '_m.id', '_i.member_id')
      .where('income_proofs.id', id)
      .where('_m.user_id', auth.user.id)
      .first()

    if (!proof) {
      throw new HttpException('Invalid income proof', 404)
    }
    await IncomeProof.query().where('id', proof.id).delete()

    response.res(true)
  }
}

module.exports = MemberController
