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
}

module.exports = NoticeController
