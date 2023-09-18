const yup = require('yup')
const { isEmpty } = require('lodash')
const { map } = require('bluebird')

const { ValidationException } = use('Validator')
const Company = use('App/Models/Company')
const Contact = use('App/Models/Contact')
const AppException = use('App/Exceptions/AppException')
const HttpException = use('App/Exceptions/HttpException')
const Database = use('Database')
const { phoneSchema } = require('../Libs/schemas')

const {
  MATCH_STATUS_FINISH,
  COMPANY_TYPE_PRIVATE,
  COMPANY_TYPE_PROPERTY_MANAGER,
  COMPANY_TYPE_PRIVATE_HOUSING,
  COMPANY_TYPE_MUNICIPAL_HOUSING,
  COMPANY_TYPE_HOUSING_COOPERATIVE,
  COMPANY_TYPE_LISTED_HOUSING,
  COMPANY_TYPE_BROKER,
  COMPANY_SIZE_SMALL,
  COMPANY_SIZE_MID,
  COMPANY_SIZE_LARGE,
  STATUS_DELETE,
} = require('../constants')

class CompanyService {
  /**
   *
   */
  static async getUserCompany(userId, companyId = null) {
    let query = Company.query()
      .select('companies.*')
      .innerJoin({ _u: 'users' }, function () {
        this.on('_u.company_id', 'companies.id').on('_u.id', userId)
      })
      .whereNot('companies.status', STATUS_DELETE)
      .with('contacts')

    if (companyId) {
      query.where('companies.id', companyId)
    }

    return await query.first()
  }

  /**
   *
   */
  static async createCompany(data, userId, trx) {
    return Company.createItem(
      {
        ...data,
        user_id: userId,
      },
      trx
    )
  }

  /**
   *
   */
  static async updateCompany(userId, data, trx = null) {
    let userCompany = await this.getUserCompany(userId)
    if (!userCompany) {
      throw new AppException('Company not exists', 400)
    }

    if (trx) {
      await userCompany.updateItemWithTrx(data, trx)
    } else {
      await userCompany.updateItem(data)
    }

    userCompany = await this.getUserCompany(userId)
    return userCompany
  }

  /**
   *
   */
  static async removeCompany(companyId, userId) {
    const company = await CompanyService.getUserCompany(userId, companyId)
    if (!company) {
      throw new HttpException('No permission to delete')
    }

    const trx = await Database.beginTransaction()
    try {
      await User.query().update({ company_id: null }).where('company_id', companyId)
      const company = await Company.query().where('id', companyId).update({ status: STATUS_DELETE })
      await trx.commit()
      return company
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 500)
    }
  }

  /**
   *
   */
  static async getContacts(userId, companyId = null) {
    return await Contact.query()
      .select('contacts.*')
      .innerJoin({ _u: 'users' }, function () {
        this.on('_u.company_id', 'contacts.company_id').on('_u.id', userId)
      })
      .innerJoin({ _cm: 'companies' }, function () {
        this.on('_cm.id', '_u.company_id').onNotIn('_cm.status', [STATUS_DELETE])
        if (companyId) {
          this.on('_cm.id', companyId)
        }
      })
      .fetch()
  }

  /**
   *
   */
  static async createContact({ data, user_id }, trx) {
    const currentContacts = await this.getContacts(user_id)

    if (currentContacts?.rows?.length > 0) {
      throw new HttpException('only 1 contact can be added', 400)
    }

    const user = await require('./UserService').getById(user_id)
    if (!user) {
      throw new HttpException('User not exists', e.status || 500)
    }

    let contact
    if (trx) {
      contact = await Contact.createItem(
        {
          ...data,
          company_id: user.company_id,
          user_id: user_id,
        },
        trx
      )
    } else {
      contact = await Contact.createItem({
        ...data,
        company_id: user.company_id,
        user_id: user_id,
      })
    }
    return contact
  }

  /**
   *
   */
  static async updateContact({ id, user_id, data }, trx) {
    const contact = await Contact.query()
      .select('contacts.*')
      .where({ 'contacts.id': id, 'contacts.user_id': user_id })
      .innerJoin({ _cm: 'companies' }, function () {
        this.on('_cm.id', 'contacts.company_id').onNotIn('_cm.status', [STATUS_DELETE])
      })
      .first()

    if (!contact) {
      throw new AppException('No contact exist', 400)
    }
    if (trx) {
      await contact.updateItemWithTrx(data, trx)
    } else {
      await contact.updateItem(data)
    }

    return contact
  }

  /**
   *
   */
  static async removeContact(id, userId) {
    return await Contact.query()
      .where({ 'contacts.id': id, 'contacts.user_id': userId })
      .update({ status: STATUS_DELETE })
  }

  /**
   *
   */
  static async getLandlordContacts(userId, tenantUserId) {
    return await Company.query()
      .select('companies.*')
      .innerJoin({ _m: 'matches' }, function () {
        this.onIn('_m.estate_id', function () {
          this.select('estates.id').from('estates').where('user_id', userId)
        })
          .onIn('_m.user_id', [tenantUserId])
          .onIn('_m.status', [MATCH_STATUS_FINISH])
      })
      .innerJoin({ _u: 'users' }, function () {
        this.on('_u.company_id', 'companies.id').on('_u.id', userId)
      })
      .whereNot('companies.status', STATUS_DELETE)
      .with('contacts')
      .first()
  }

  /**
   *
   */
  static async validateUserContacts(userId) {
    const contacts = await Company.query()
      .innerJoin({ _u: 'users' }, function () {
        this.on('_u.company_id', 'companies.id').on('_u.id', userId)
      })
      .innerJoin({ _ct: 'contacts' }, '_ct.company_id', 'companies.id')
      .whereNot('companies.status', STATUS_DELETE)
      .limit(10)
      .fetch()

    if (isEmpty(contacts.rows)) {
      const error = new ValidationException()
      error.messages = [{ field: null, validation: 'Contacts not exists' }]
      throw new HttpException(error.messages, 400)
    }

    const schema = yup.object().shape({
      name: yup.string().max(255).required(),
      address: yup.string().max(255).required(),
      size: yup.string().oneOf([COMPANY_SIZE_SMALL, COMPANY_SIZE_MID, COMPANY_SIZE_LARGE]),
      type: yup
        .string()
        .oneOf([
          COMPANY_TYPE_PRIVATE,
          COMPANY_TYPE_PROPERTY_MANAGER,
          COMPANY_TYPE_PRIVATE_HOUSING,
          COMPANY_TYPE_MUNICIPAL_HOUSING,
          COMPANY_TYPE_HOUSING_COOPERATIVE,
          COMPANY_TYPE_LISTED_HOUSING,
          COMPANY_TYPE_BROKER,
        ])
        .required(),
      email: yup.string().email().lowercase().max(255).required(),
      full_name: yup.string().min(2).max(255).required(),
      phone: phoneSchema.nullable(),
    })
    try {
      await map(contacts.rows, (i) => {
        return schema.validate(i)
      })
    } catch (e) {
      console.log('validateUserContacts eror', e.message)
      throw new HttpException(
        'Please double check if you have added Your name, company size, type, email address, company name, phone number'
      )
    }
  }

  /**
   * Delete company completely
   * It's only used for deleting test company
   */

  static async permanentDelete(id) {
    await Company.query().where('id', id).delete()
  }
}

module.exports = CompanyService
