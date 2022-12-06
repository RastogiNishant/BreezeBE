'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Notice = use('App/Models/Notice')
class AdjustNoticeSchema extends Schema {
  async up() {
    try {
      const noticesCount = await Notice.query().whereNotNull('data').count()

      let notices = await Notice.query().whereNotNull('data').fetch()

      notices = notices.toJSON().filter((notice) => !notice.estate_id)
      await Notice.query()
        .where('id', notices[0].id)
        .update({ estate_id: notices[0].data.estate_id })
      let i = 0
      while (i < notices.length) {
        const partialNotices = notices.splice(i, 20)
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

  async adjust({ page, limit }) {
    try {
      let notices = await Notice.query().whereNotNull('data').fetch()

      notices = notices.toJSON().filter((notice) => !notice.estate_id)
      await Promise.all(
        notices.map(async (notice) => {
          await Notice.query().where('id', notice.id).update({ estate_id: notice.data.estate_id })
        })
      )
    } catch (e) {
      console.log('AdjustNoticeSchema error=', e.message)
    }
  }

  down() {}
}

module.exports = AdjustNoticeSchema
