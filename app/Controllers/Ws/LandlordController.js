'use strict'
const BaseController = require('./BaseController')
const ChatService = use('App/Services/ChatService')

class LandlordController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
  }

  /**
   * Event handler for getTaskUnreadMessages
   */
  async onGetTaskUnreadMessages() {
    try {
      const userUnreadMessagesByTopic = await ChatService.getUserUnreadMessagesByTopic(
        this.user.id,
        this.user.role
      )
      if (this.topic) {
        //this will send back to sender...
        try {
          this.topic.emitTo('taskUnreadMessages', { unread: userUnreadMessagesByTopic }, [
            this.socket.id,
          ])
        } catch (e) {
          console.log(e)
        }
      }
    } catch (err) {
      this.emitError(err.message)
    }
  }
}

module.exports = LandlordController
