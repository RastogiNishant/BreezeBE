'use strict'

//endpoint for General Chat
class EstateChatController {
  constructor({ socket, request }) {
    this.socket = socket
    this.request = request
  }

  onMessage(message) {
    //add record to db...
  }
}

module.exports = EstateChatController
