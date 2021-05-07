'use strict'

const Member = use('App/Models/Member')
const IncomeProof = use('App/Models/IncomeProof')
const File = use('App/Classes/File')
const AppException = use('App/Exceptions/AppException')

const {
  MEMBER_FILE_TYPE_RENT,
  MEMBER_FILE_TYPE_DEBT,
  MEMBER_FILE_TYPE_INCOME,
} = require('../constants')

class TenantService {
  /**
   *
   */
  static async getProtectedFileLink(userId, fileId, fileType, memberId) {
    if (fileType === MEMBER_FILE_TYPE_INCOME) {
      const incomeProof = await IncomeProof.query()
        .select('income_proofs.*')
        .innerJoin({ _i: 'incomes' }, '_i.id', 'income_proofs.income_id')
        .innerJoin({ _m: 'members' }, '_m.id', '_i.member_id')
        .where('income_proofs.id', fileId)
        .where('_m.id', memberId)
        .where('_m.user_id', userId)
        .first()
      if (!incomeProof) {
        throw new AppException('File not exists')
      }

      return File.getProtectedUrl(incomeProof.file)
    } else {
      const member = await Member.query().where('id', memberId).where('user_id', userId).first()
      if (!member) {
        throw new AppException('File not exists')
      }
      if (fileType === MEMBER_FILE_TYPE_DEBT) {
        return member.debt_proof && File.getProtectedUrl(member.debt_proof)
      } else if (fileType === MEMBER_FILE_TYPE_RENT) {
        return member.rent_arrears_doc && File.getProtectedUrl(member.rent_arrears_doc)
      }
    }
  }
}

module.exports = TenantService
