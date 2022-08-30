'use strict'
const BaseController = require('./BaseController')
const ChatService = use('App/Services/ChatService')

class TenantController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
  }

  /**
   * Event handler for getTaskUnreadMessages
   */
  async onGetTaskUnreadMessages() {
    const userUnreadMessagesByTopic = await ChatService.getUserUnreadMessagesByTopic(
      this.user.id,
      this.user.role
    )
    if (this.topic) {
      //this will send back to sender...
      this.topic.emitTo('taskUnreadMessages', { unread: userUnreadMessagesByTopic }, [
        this.socket.id,
      ])
    }
  }
}

module.exports = TenantController
