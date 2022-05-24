'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const CompanyService = use('App/Services/CompanyService')
const { groupBy } = require('lodash')

class RemoveMultipleContactLeaveOnlylOneSchema extends Schema {
  async up() {
    const contacts = await Database.query()
      .from('contacts')
      .select(['id', 'company_id', 'user_id'])
      .orderBy(['user_id', 'company_id'])

    const groupedContacts = Object.values(
      groupBy(contacts, (contact) => `"${contact.user_id}+${contact.company_id}"`)
    )

    const trx = await Database.beginTransaction()
    try {
      await Promise.all(
        groupedContacts.map(async (gcs) => {
          await Promise.all(
            gcs.map(async (contact, index) => {
              if (index == 0) return
              await CompanyService.removeCompany(contact.company_id, contact.user_id, trx)
            })
          )
        })
      )
      await trx.commit()
    } catch (e) {
      await trx.rollback()
    }
  }

  down() {}
}

module.exports = RemoveMultipleContactLeaveOnlylOneSchema
