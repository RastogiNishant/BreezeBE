const { isEmpty } = require('lodash')
const { map } = require('bluebird')

const { ValidationException } = use('Validator')
const Company = use('App/Models/Company')
const Contact = use('App/Models/Contact')
const AppException = use('App/Exceptions/AppException')

const CreateCompany = require('../Validators/CreateCompany')
const CreateContact = require('../Validators/CreateContact')

const { wrapValidationError } = require('../Libs/utils.js')
const { MATCH_STATUS_FINISH } = require('../constants')

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

  /**
   *
   */
  static async getLandlordContacts(userId, tenantUserId) {
    return Company.query()
      .select('companies.*')
      .innerJoin({ _m: 'matches' }, function () {
        this.onIn('_m.estate_id', function () {
          this.select('id').from('estates').where('user_id', userId)
        })
          .onIn('_m.user_id', [tenantUserId])
          .onIn('_m.status', [MATCH_STATUS_FINISH])
      })
      .where({ 'companies.user_id': userId })
      .with('contacts')
      .first()
  }

  /**
   *
   */
  static async validateUserContacts(userId) {
    const contacts = await Company.query()
      .where({ 'companies.user_id': userId })
      .innerJoin({ _ct: 'contacts' }, '_ct.company_id', 'companies.id')
      .limit(10)
      .fetch()

    if (isEmpty(contacts.rows)) {
      const error = new ValidationException()
      error.messages = [{ field: null, validation: 'Contacts not exists' }]
      throw error
    }

    const schema = CreateCompany.schema().concat(CreateContact.schema())
    try {
      await map(contacts.rows, (i) => {
        return schema.validate(i)
      })
    } catch (e) {
      throw wrapValidationError(e)
    }
  }
}

module.exports = CompanyService
