'use strict'

class EstateTaskController {
  constructor({ socket, request }) {
    this.socket = socket
    this.request = request
    this.topic = Ws.getChannel('chat:*').topic(this.socket.topic)
  }

  onCreateTask() {
    //
  }

  onAnswer() {}

  onMessage() {}
}

module.exports = EstateTaskController
