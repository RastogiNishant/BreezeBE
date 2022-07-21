'use strict'

const Ws = use('Ws')
const { isNull } = require('lodash')
const { BREEZE_BOT_USER } = require('../../constants')
const ChatService = use('App/Services/ChatService')

class BaseController {
  constructor({ socket, auth, request, channel }) {
    this.socket = socket
    this.request = request
    this.topic = Ws.getChannel(this.socket.channel.name).topic(this.socket.topic)
    this.user = auth.user
    console.log('hererer')
  }
  //this will broadcast to all including sender
  broadcast(message, event = 'message', sender = null) {
    //sender is null when user, 0 when bot
    if (this.topic && isNull(sender)) {
      this.topic.broadcast(event, {
        message,
        sender: {
          userId: this.user.id,
          firstname: this.user.firstname,
          secondname: this.user.secondname,
          avatar: this.user.avatar,
        },
      })
    } else if (this.topic && sender == 0) {
      this.topic.broadcast(event, {
        message,
        sender: BREEZE_BOT_USER,
      })
    }
  }
  //this will broadcast to all except sender
  broadcastToAll(message, event = 'message', sender = null) {
    //sender is null when user, 0 when bot
    if (this.topic && isNull(sender)) {
      this.topic.broadcastToAll(event, {
        message,
        sender: {
          userId: this.user.id,
          firstname: this.user.firstname,
          secondname: this.user.secondname,
          avatar: this.user.avatar,
        },
      })
    } else if (this.topic && sender == 0) {
      this.topic.broadcastToAll(event, {
        message,
        sender: BREEZE_BOT_USER,
      })
    }
  }
  //this will send message to sender given socket.id
  emitToSender(message, event = 'message', sender = null) {
    if (this.topic && isNull(sender)) {
      this.topic.emitTo(
        event,
        {
          message,
          sender: {
            userId: this.user.id,
            firstname: this.user.firstname,
            secondname: this.user.secondname,
            avatar: this.user.avatar,
          },
        },
        [this.socket.id]
      )
    } else if (this.topic && sender == 0) {
      this.topic.emitTo(
        event,
        {
          message,
          sender: BREEZE_BOT_USER,
        },
        [this.socket.id]
      )
    }
  }
  //override this on the child controller
  onMessage(message) {
    message.dateTime = message.dateTime ? message.dateTime : new Date()
    if (this.topic) {
      this.broadcast(message, 'message')
    }
  }

  async _markLastRead(taskId) {
    await ChatService.markLastRead(this.user.id, taskId)
  }

  async _saveToChats(message, taskId = null) {
    let chat = await ChatService.save(message, this.user.id, taskId)
    return chat
  }
}

module.exports = BaseController
