'use strict'

const { STATUS_DRAFT, STATUS_EMAIL_VERIFY } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Promise = require('bluebird')
const EstateSyncContactRequest = use('App/Models/EstateSyncContactRequest')
const MarketPlaceService = use('App/Services/MarketPlaceService')
const Estate = use('App/Models/Estate')

class FillUpLinkToEstateContactRequestSchema extends Schema {
  async up() {
    const contacts = (
      await EstateSyncContactRequest.query()
        .whereIn('status', [STATUS_DRAFT, STATUS_EMAIL_VERIFY])
        .whereNull('link')
        .fetch()
    ).rows

    await Promise.map(
      contacts,
      async (contact) => {
        const estate = await Estate.query().where('id', contact.estate_id).first()
        if (estate && !contact.link) {
          const { shortLink, code, lang, user_id } = await MarketPlaceService.createDynamicLink({
            estate: estate.toJSON(),
            email: contact.email,
          })

          await EstateSyncContactRequest.query().where('id', contact.id).update({ link: shortLink })
        }
      },
      { concurrency: 1 }
    )
  }

  down() {}
}

module.exports = FillUpLinkToEstateContactRequestSchema
