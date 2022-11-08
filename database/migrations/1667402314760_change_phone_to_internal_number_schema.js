'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Contact = use('App/Models/Contact')

class ChangePhoneToInternalNumberSchema extends Schema {
  async up() {
    const contacts = (await Contact.query().select(['id', 'phone']).whereNotNull('phone').fetch())
      .rows
    console.log('contacts here=', contacts)
    await Promise.all(
      (contacts || []).map(async (contact) => {
        if (contact.phone && contact.phone.indexOf('+') === -1) {
          await Contact.query()
            .where('id', contact.id)
            .update({ phone: `+${contact.phone}` })
        }
      })
    )
  }

  down() {}
}

module.exports = ChangePhoneToInternalNumberSchema
