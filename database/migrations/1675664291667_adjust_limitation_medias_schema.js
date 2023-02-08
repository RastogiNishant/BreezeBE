'use strict'

const { STATUS_DELETE, FILE_LIMIT_LENGTH } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')
const File = use('App/Models/File')
const Room = use('App/Models/Room')
const Image = use('App/Models/Image')
const Database = use('Database')
const Promise = require('bluebird')
class AdjustLimitationMediasSchema extends Schema {
  async up() {
    const estates =
      (
        await Estate.query()
          .whereNot('status', STATUS_DELETE)
          .with('files')
          .with('rooms', function (r) {
            r.with('images')
          })
          .fetch()
      ).toJSON() || []

    let i = 0
    while (i < estates.length) {
      try {
        const trx = await Database.beginTransaction()
        const estate = estates[i]
        if (estate.files && estate.files.length > FILE_LIMIT_LENGTH) {
          const fileIds = estate.files
            .map((f) => f.id)
            .splice(FILE_LIMIT_LENGTH, estate.files.length)

          await File.query().whereIn('id', fileIds).delete().transacting(trx)
        }

        await Promise.map(estate.rooms, async (room) => {
          if (room.images && room.images.length > FILE_LIMIT_LENGTH) {
            const imageIds = room.images
              .map((i) => i.id)
              .splice(FILE_LIMIT_LENGTH, room.images.length)
            await Image.query().whereIn('id', imageIds).delete().transacting(trx)
          }
        })

        await trx.commit()
      } catch (e) {
        await trx.rollback()
      }
      i++
    }
  }

  down() {}
}

module.exports = AdjustLimitationMediasSchema
