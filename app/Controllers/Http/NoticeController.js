'use strict'

const NoticeService = use('App/Services/NoticeService')

class NoticeController {
  /**
   *
   */
  async getNotices({ request, auth, response }) {
    const userId = auth.user.id
    const { date_to, date_from } = request.all()

    const notices = await NoticeService.getUserNoticesList(userId, date_to, date_from)

    response.res(notices)
  }

  /**
   *
   */
  async sendTestNotification({ request, auth, response }) {
    const userId = auth.user.id
    const { estate_id, data, type } = request.all()

    const result = await NoticeService.sendTestNotification(userId, type, estate_id, data)

    response.res(result)
  }
}

module.exports = NoticeController
