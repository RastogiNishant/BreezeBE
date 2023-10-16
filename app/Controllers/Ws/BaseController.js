'use strict'

const Ws = use('Ws')
const { isNull } = require('lodash')
const {
  BREEZE_BOT_USER,
  WEBSOCKET_LANDLORD_REDIS_KEY,
  WEBSOCKET_TENANT_REDIS_KEY
} = require('../../constants')
const TaskService = use('App/Services/TaskService')
const ChatService = use('App/Services/ChatService')
const File = use('App/Classes/File')
const Database = use('Database')
const Logger = use('Logger')
const WebSocket = use('App/Classes/Websocket')
const {
  exceptions: { MESSAGE_NOT_SAVED }
} = require('../../exceptions')
class BaseController {
  constructor({ socket, auth, request, channel }) {
    this.socket = socket
    this.request = request
    this.topic = Ws.getChannel(this.socket.channel.name).topic(this.socket.topic)
    this.user = auth.user
  }

  subscribe({ channel, estateId, taskId }) {
    try {
      if ([WEBSOCKET_LANDLORD_REDIS_KEY, WEBSOCKET_TENANT_REDIS_KEY].includes(channel)) {
        WebSocket.subscribe(`${channel}:${this.user.id}`)
      } else {
        WebSocket.subscribe(`${channel}:${estateId}brz${taskId}`)
      }
    } catch (e) {
      console.log('LandlordController subscribe error', e.message)
    }
  }

  unsubscribe({ channel, estateId, taskId }) {
    this.socket.on('close', async () => {
      try {
        if ([WEBSOCKET_LANDLORD_REDIS_KEY, WEBSOCKET_TENANT_REDIS_KEY].includes(channel)) {
          WebSocket.unsubscribe(`${channel}:${this.user.id}`)
        } else {
          WebSocket.unsubscribe(`${channel}:${estateId}brz${taskId}`)
        }
      } catch (e) {
        console.log('connection close error', e.message)
      }
    })
  }

  //this will broadcast to all except sender
  broadcast(message, event = 'message', sender = null) {
    //sender is null when user, 0 when bot
    try {
      if (this.topic && isNull(sender)) {
        this.topic.broadcast(event, {
          message,
          sender: {
            userId: this.user.id,
            firstname: this.user.firstname,
            secondname: this.user.secondname,
            avatar: this.user.avatar
          },
          topic: this.socket.topic
        })
      } else if (this.topic && sender == 0) {
        this.topic.broadcast(event, {
          message,
          sender: BREEZE_BOT_USER,
          topic: this.socket.topic
        })
      }
    } catch (err) {
      this.emitError(err.message)
    }
  }

  //this will send message to sender given socket.id
  emitToSender(message, event = 'message', sender = null) {
    try {
      if (this.topic && isNull(sender)) {
        this.topic.emitTo(
          event,
          {
            message,
            sender: {
              userId: this.user.id,
              firstname: this.user.firstname,
              secondname: this.user.secondname,
              avatar: this.user.avatar
            },
            topic: this.socket.topic
          },
          [this.socket.id]
        )
      } else if (this.topic && sender == 0) {
        this.topic.emitTo(
          event,
          {
            message,
            sender: BREEZE_BOT_USER,
            topic: this.socket.topic
          },
          [this.socket.id]
        )
      }
    } catch (err) {
      this.emitError(err.message)
    }
  }

  emitError(message) {
    try {
      this.topic?.emitTo('error', { message }, [this.socket.id])
    } catch (e) {
      Logger.error(`BaseController emitError ${e.message || e}`)
    }
  }

  async _markLastRead(taskId) {
    try {
      return await ChatService.markLastRead({
        user_id: this.user.id,
        task_id: taskId,
        role: this.user.role
      })
    } catch (err) {
      this.emitError(err.message)
    }
  }

  async _saveToChats(message, taskId = null) {
    const trx = await Database.beginTransaction()
    try {
      let chat = await ChatService.save({ message, user_id: this.user.id, task_id: taskId }, trx)
      await TaskService.updateUnreadMessageCount(
        { task_id: taskId, role: this.user.role, chat_id: chat.id },
        trx
      )
      await trx.commit()
      return chat
    } catch (e) {
      await trx.rollback()
      Logger.error(`SaveToChats error ${e.message || e}`)
      this.emitError(MESSAGE_NOT_SAVED)
    }
    return null
  }

  /**
   *
   * @param {String} topicString where to broadcast the event
   * @param {String} event
   * @param {Any} message
   */
  async broadcastToTopic(topicString, event, message) {
    try {
      const matches = topicString.match(/([a-z]+):/i)
      const topic = Ws.getChannel(`${matches[0]}*`).topic(topicString)
      if (topic) {
        topic.broadcast(event, message)
      }
    } catch (err) {
      this.emitError(err.message)
    }
  }

  async getAbsoluteUrl(attachments) {
    try {
      if (!attachments || !attachments.length) {
        return null
      }
      if (!Array.isArray(attachments)) attachments = JSON.parse(attachments)
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
              thumb: thumb
            }
          }

          return {
            url: attachment,
            uri: attachment,
            thumb: thumb
          }
        })
      )
      return attachments
    } catch (e) {
      console.log(`getAbsoluteUrl ${e.message || e}`)
    }
  }

  async getItemsWithAbsoluteUrl(items) {
    if (!items?.length) {
      return null
    }

    try {
      items = await Promise.all(
        (items = items.map(async (item) => {
          if (item.attachments) {
            item.attachments = await this.getAbsoluteUrl(item.attachments)
          }
          return item
        }))
      )
      return items
    } catch (e) {
      return null
    }
  }
}

module.exports = BaseController
