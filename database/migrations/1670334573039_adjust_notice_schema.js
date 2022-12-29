'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Notice = use('App/Models/Notice')
class AdjustNoticeSchema extends Schema {
  async up() {
    try {
      let notices = await Notice.query().whereNotNull('data').fetch()

      notices = notices.toJSON().filter((notice) => !notice.estate_id)
      let i = 0
      while (i < notices.length) {
        const partialNotices = notices.slice(i, 20)
        await Promise.all(
          partialNotices.map(async (notice) => {
            await Notice.query().where('id', notice.id).update({ estate_id: notice.data.estate_id })
          })
        )
        i += 20
      }
    } catch (e) {
      console.log('AdjustNoticeSchema error=', e.message)
    }
  }

  down() {}
}

module.exports = AdjustNoticeSchema
