'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const { isEmpty } = require('lodash')

class PopulateSixCharEstateIdSchema extends Schema {
  generateRandomString(length = 6) {
    let randomString = ''
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
    for (var i = 0; i < length; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return randomString
  }

  async up() {
    this.schedule(async (trx) => {
      const estates = await Database.table('estates').select('id')

      await Promise.all(
        estates.map(async (estate) => {
          let randomString
          let exists
          do {
            randomString = this.generateRandomString(6)
            exists = await Database.table('estates')
              .where('six_char_code', randomString)
              .select('id')
              .first()
          } while (exists)
          await Database.table('estates')
            .where('id', estate.id)
            .update({ six_char_code: randomString })
        })
      )
    })
  }

  down() {}
}

module.exports = PopulateSixCharEstateIdSchema
