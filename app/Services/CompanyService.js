const Company = use('App/Models/Company')
const Contact = use('App/Models/Contact')
const AppException = use('App/Exceptions/AppException')

class CompanyService {
  /**
   *
   */
  static async getUserCompany(userId) {
    return Company.query().where({ user_id: userId }).first()
  }

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

  /**
   *
   */
  static async updateCompany(companyId, userId, data) {
    const userCompany = await Company.query().where({ user_id: userId, id: companyId }).first()
    if (!userCompany) {
      throw new AppException('Company not exists')
    }
    await userCompany.updateItem(data)

    return userCompany
  }

  /**
   *
   */
  static async removeCompany(companyId, userId) {
    return Company.query().where({ user_id: userId, id: companyId }).delete()
  }

  /**
   *
   */
  static async getContacts(userId) {
    return Contact.query()
      .select('contacts.*')
      .innerJoin({ _cm: 'companies' }, '_cm.id', 'contacts.company_id')
      .where({ ' _cm.user_id ': userId })
      .fetch()
  }

  /**
   *
   */
  static async createContact(data, userId) {
    const company = await CompanyService.getUserCompany(userId)
    if (!company) {
      throw new AppException('User has no companies')
    }

    return Contact.createItem({
      ...data,
      user_id: userId,
      company_id: company.id,
    })
  }

  /**
   *
   */
  static async updateContact(id, userId, data) {
    const contact = await Contact.query()
      .select('contacts.*')
      .where({ 'contacts.id': id, 'contacts.user_id': userId })
      .innerJoin({ _cm: 'companies' }, '_cm.id', 'contacts.company_id')
      .first()

    if (!contact) {
      throw new AppException('Invalid contact')
    }
    await contact.updateItem(data)

    return contact
  }

  /**
   *
   */
  static async removeContact(id, userId) {
    return Contact.query().where({ 'contacts.id': id, 'contacts.user_id': userId }).delete()
  }
}

module.exports = CompanyService
