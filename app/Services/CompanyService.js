const Company = use('App/models/Company')
const Contact = use('App/models/Contact')
const AppException = use('App/Exceptions/AppException')

class CompanyService {
  /**
   *
   */
  static async createCompany(data, userId) {
    const existing = await Company.query().where({ user_id: userId }).first()
    if (existing) {
      throw new AppException('User already has company')
    }

    return Company.createItem({
      ...data,
      user_id: userId,
    })
  }
}

module.exports = CompanyService
