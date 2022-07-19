'use strict'

const Ws = use('Ws')
const { isNull } = require('lodash')
const {
  BREEZE_BOT_USER,
  CHAT_TYPE_LAST_READ_MARKER,
  CHAT_TYPE_MESSAGE,
} = require('../../constants')
const Chat = use('App/Models/Chat')
const Database = use('Database')

class BaseController {
  constructor({ socket, auth, request, channel }) {
    this.socket = socket
    this.request = request
    this.topic = Ws.getChannel(this.socket.channel.name).topic(this.socket.topic)
    this.user = auth.user
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
    const trx = await Database.beginTransaction()
    try {
      await Chat.query()
        .where({
          type: CHAT_TYPE_LAST_READ_MARKER,
          sender_id: this.user.id,
          task_id: taskId,
        })
        .delete()
        .transacting(trx)
      await Chat.query().insert(
        {
          type: CHAT_TYPE_LAST_READ_MARKER,
          sender_id: this.user.id,
          task_id: taskId,
        },
        trx
      )
      await trx.commit()
    } catch (err) {
      console.log(err)
      await trx.rollback()
    }
  }

  async _saveToChats(message, taskId = null) {
    let data = {}
    if (message.message) {
      data.text = message.message
    } else {
      data.text = message
    }
    if (message.attachments) {
      data.attachments = message.attachments
    }
    data.task_id = taskId
    data.sender_id = this.user.id
    data.type = CHAT_TYPE_MESSAGE
    const chat = await Chat.create(data)
    return chat
  }
}

module.exports = BaseController
