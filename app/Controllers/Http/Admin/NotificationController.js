'use_strict'

const { NOTICE_TYPE_PROSPECT_REACTIVATED_ID } = require('../../../constants')

const NotificationsService = use('App/Services/NotificationsService')
const NoticeService = use('App/Services/NoticeService')
const Promise = use('bluebird')
const Database = use('Database')
const File = use('App/Classes/File')

class NotificationController {
  async sendNotification({ request, response }) {
    const { estateId, userIds } = request.all()
    const estate = await Database.table('estates').where('id', estateId).first()
    await Promise.map(userIds, async (userId) => {
      const notice = {
        user_id: userId,
        type: 13,
        data: {
          estate_id: estate.id,
          estate_address: estate.address
        },
        image: File.getPublicUrl(estate.cover)
      }
      await NotificationsService.prospectLikedButNotKnocked([notice])
    })
    return response.res(true)
  }

  async sendReactivateNotification({ request, response }) {
    const { userIds } = request.all()
    await Promise.map(userIds, async (userId) => {
      const notice = {
        user_id: userId,
        type: NOTICE_TYPE_PROSPECT_REACTIVATED_ID
      }
      await NoticeService.insertNotices([notice])
      await NotificationsService.prospectReactivated([notice])
    })
    response.res(userIds)
  }
}

module.exports = NotificationController
