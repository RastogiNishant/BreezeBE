'use strict'

const NoticeService = use('App/Services/NoticeService')

class NoticeController {
  /**
   *
   */
  async getNotices({ request, auth, response }) {
    const userId = auth.user.id
    const { estate_id, date_to, date_from } = request.all()

    let notices = await NoticeService.getUserNoticesList(userId, date_to, date_from)
    if( estate_id ) {
      notices = notices.filter( notice => notice.data && notice.data.estate_id && notice.data.estate_id == estate_id )
    }
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
  async acceptZendeskNotification( {request, response} ) {
    const {ticket} = request.all()
console.log('Ticket', ticket)    
    response.res(ticket?ticket:true)
  }
}

module.exports = NoticeController
