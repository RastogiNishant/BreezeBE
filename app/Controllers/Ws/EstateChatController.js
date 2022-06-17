'use strict'

//endpoint for General Chat
class EstateChatController {
  constructor({ socket, request }) {
    this.socket = socket
    this.request = request
    this.topic = Ws.getChannel('estate:*').topic(this.socket.topic)
  }

  onMessage(message) {
    //add record to db...
  }

  onMarkLastRead

  onConnect() {
    //send
  }
}

module.exports = EstateChatController
