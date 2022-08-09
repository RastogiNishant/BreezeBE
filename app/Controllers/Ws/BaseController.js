'use strict'

const Ws = use('Ws')
const { isNull } = require('lodash')
const { BREEZE_BOT_USER } = require('../../constants')
const ChatService = use('App/Services/ChatService')
const File = use('App/Classes/File')

class BaseController {
  constructor({ socket, auth, request, channel }) {
    this.socket = socket
    this.request = request
    this.topic = Ws.getChannel(this.socket.channel.name).topic(this.socket.topic)
    this.user = auth.user
  }
  //this will broadcast to all except sender
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
        topic: this.socket.topic,
      })
    } else if (this.topic && sender == 0) {
      this.topic.broadcast(event, {
        message,
        sender: BREEZE_BOT_USER,
        topic: this.socket.topic,
      })
    }
  }
  //this will broadcast to all including sender
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
        topic: this.socket.topic,
      })
    } else if (this.topic && sender == 0) {
      this.topic.broadcastToAll(event, {
        message,
        sender: BREEZE_BOT_USER,
        topic: this.socket.topic,
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
          topic: this.socket.topic,
        },
        [this.socket.id]
      )
    } else if (this.topic && sender == 0) {
      this.topic.emitTo(
        event,
        {
          message,
          sender: BREEZE_BOT_USER,
          topic: this.socket.topic,
        },
        [this.socket.id]
      )
    }
  }
  //override this on the child controller
  onMessage(message) {
    message.dateTime = message.dateTime ? message.dateTime : new Date()
    if (this.topic) {
      //FIXME: this will send sender twice on data...
      this.broadcastToAll(message, 'message')
    }
  }

  emitError(message) {
    this.topic.emitTo('error', { message }, [this.socket.id])
  }

  async _markLastRead(taskId) {
    await ChatService.markLastRead(this.user.id, taskId)
  }

  async _saveToChats(message, taskId = null) {
    let chat = await ChatService.save(message, this.user.id, taskId)

    if (chat.success === false) {
      this.emitError(chat.message)
    }

    return chat
  }

  /**
   *
   * @param {String} topicString where to broadcast the event
   * @param {String} event
   * @param {Any} message
   */
  async broadcastToTopic(topicString, event, message) {
    const matches = topicString.match(/([a-z]+):/i)
    const topic = Ws.getChannel(`${matches[0]}*`).topic(topicString)
    if (topic) {
      topic.broadcast(event, message)
    }
  }

  static async getAbsoluteUrl(attachments) {
    if (!attachments || !attachments.length) {
      return null
    }
    attachments = await Promise.all(
      attachments.map(async (attachment) => {
        const thumb =
          attachment.split('/').length === 2
            ? await File.getProtectedUrl(
                `thumbnail/${attachment.split('/')[0]}/thumb_${attachment.split('/')[1]}`
              )
            : ''

        if (attachment.search('http') !== 0) {
          return {
            url: await File.getProtectedUrl(attachment),
            uri: attachment,
            thumb: thumb,
          }
        }

        return {
          url: attachment,
          uri: attachment,
          thumb: thumb,
        }
      })
    )

    return attachments
  }
  static async getItemsWithAbsoluteUrl(items) {
    if (!items || !items.length) {
      return null
    }

    try {
      items = await Promise.all(
        items = items.map(async (item) => {
          if (item.attachments) {
            item.attachments = await this.getAbsoluteUrl(item.attachments)
          }
          return item
        })
      )
      return items
    } catch (e) {
      return null
    }
  }
}

module.exports = BaseController
