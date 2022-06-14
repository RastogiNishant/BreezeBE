'use strict'

class ChatController {
  constructor({ socket, request }) {
    this.socket = socket
    this.request = request
  }

  onMessage(message) {
    console.log('got message', message, 'topic', this.socket.topic)
  }

  onCreateTask() {
    console.log('creating task...')
    this.socket.emit('question', 'What is your name?')
  }
}

module.exports = ChatController
