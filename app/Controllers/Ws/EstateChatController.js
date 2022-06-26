'use strict'
const Ws = use('Ws')
const Chat = use('App/Models/Chat')
//endpoint for General Chat
class EstateChatController {
  constructor({ socket, request }) {
    this.socket = socket
    this.request = request
    this.topic = Ws.getChannel('estate:*').topic(this.socket.topic)
  }

  async onMessage(message) {
    //add record to db...
    await Chat.query().insert({})
    if (this.topic) {
      this.topic.broadcastToAll('message', message)
    }
  }

  async onMarkLastRead(message) {}

  async onConnect() {
    //send
  }
}

module.exports = EstateChatController
