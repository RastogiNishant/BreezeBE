'use_strict'

const NotificationsService = use('App/Services/NotificationsService')
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
}

module.exports = NotificationController
