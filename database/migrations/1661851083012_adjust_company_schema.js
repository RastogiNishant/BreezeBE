'use strict'

const { STATUS_DELETE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Company = use('App/Models/Company')
const User = use('App/Models/User')
const Contact = use('App/Models/Contact')

class AdjustCompanySchema extends Schema {
  async up() {
    let users = await User.query().whereNotNull('company_id').fetch()

    await Promise.all(
      users.toJSON().map(async (user) => {
        const company = await Company.query()
          .where('id', user.company_id)
          .whereNot('status', STATUS_DELETE)
          .first()
        if (!company) {
          await User.query().update({ company_id: null }).where('id', user.id)
        }
      })
    )

    const companies = await Company.query().whereNot('status', STATUS_DELETE).fetch()

    await Promise.all(
      companies.toJSON().map(async (company) => {
        if (company.user_id) {
          await User.query()
            .update({ company_id: company.id })
            .where('id', company.user_id)
            .whereNull('company_id')
        }
      })
    )

    users = (await User.query().fetch()).toJSON()

    const contacts = await Contact.query().fetch()
    await Promise.all(
      contacts.toJSON().map(async (contact) => {
        const user = users.find((user) => user.id === contact.user_id && user.company_id)
        if (user) {
          await Contact.query()
            .where('user_id', contact.user_id)
            .update({ company_id: user.company_id })
        } else {
          await Contact.query().where('user_id', contact.user_id).update({ status: STATUS_DELETE })
        }
      })
    )
  }

  down() {}
}

module.exports = AdjustCompanySchema
