'use strict'
const {
  CONNECT_MESSAGE_EDITABLE_TIME_LIMIT,
  ROLE_LANDLORD,
  CHAT_EDIT_STATUS_EDITED,
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_NEW,
  TASK_STATUS_RESOLVED,
  TASK_STATUS_UNRESOLVED,
  WEBSOCKET_EVENT_TASK_MESSAGE_ALL_READ,
  WEBSOCKET_TASK_REDIS_KEY,
  DEFAULT_LANG
} = require('../../constants')
const WebSocket = use('App/Classes/Websocket')
const {
  exceptions: { MESSAGE_NOT_SAVED }
} = require('../../exceptions')
const User = use('App/Models/User')
const Estate = use('App/Models/Estate')
const BaseController = require('./BaseController')
const AppException = use('App/Exceptions/AppException')
const ChatService = use('App/Services/ChatService')
const TaskService = use('App/Services/TaskService')
const MailService = use('App/Services/MailService')
const { isBoolean } = require('lodash')
const NoticeService = use('App/Services/NoticeService')
const Logger = use('Logger')
const moment = require('moment')

class TaskController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
    this.taskId = request.task_id
    this.estateId = request.estate_id
    this.tenant_user_id = request.tenant_user_id
    this.estate_user_id = request.estate_user_id

    this.subscribe({
      channel: WEBSOCKET_TASK_REDIS_KEY,
      estateId: this.estateId,
      taskId: this.taskId
    })
    this.unsubscribe({
      channel: WEBSOCKET_TASK_REDIS_KEY,
      estateId: this.estateId,
      taskId: this.taskId
    })
  }

  async onGetPreviousMessages(data) {
    try {
      let lastId = 0

      if (data && data.lastId) {
        lastId = data.lastId
      }
      let previousMessages = await ChatService.getPreviousMessages({
        task_id: this.taskId,
        lastId
      })
      previousMessages = await super.getItemsWithAbsoluteUrl(previousMessages.toJSON())
      if (this.topic) {
        this.topic.emitTo(
          'previousMessages',
          {
            messages: previousMessages,
            topic: this.socket.topic
          },
          [this.socket.id]
        )
      }
    } catch (e) {
      Logger.error(`onGetPreviousMessages error ${e.message}`)
      this.emitError(err.message)
    }
  }

  async onEditMessage({ message, attachments, id }) {
    try {
      const messageAge = await ChatService.getChatMessageAge(id)
      if (isBoolean(messageAge) && !messageAge) {
        throw new AppException('Chat message not found.')
      }
      if (messageAge > CONNECT_MESSAGE_EDITABLE_TIME_LIMIT) {
        throw new AppException('Chat message not editable anymore.')
      }
      await ChatService.updateChatMessage({ id, message, attachments })
      attachments = await this.getAbsoluteUrl(attachments)

      WebSocket.publishToTask({
        event: 'messageEdited',
        taskId: this.taskId,
        estateId: this.estateId,
        data: {
          id,
          message,
          attachments,
          edit_status: CHAT_EDIT_STATUS_EDITED,
          topic: this.socket.topic
        }
      })
    } catch (err) {
      this.emitError(err.message)
    }
  }

  async onRemoveMessage({ id }) {
    try {
      const chat = await ChatService.getChatMessageAge(id)
      const messageAge = chat?.difference || false
      if (isBoolean(messageAge) && !result) {
        throw new AppException('Chat message not found.')
      }
      if (messageAge > CONNECT_MESSAGE_EDITABLE_TIME_LIMIT) {
        throw new AppException('Chat message not editable anymore.')
      }
      await ChatService.removeChatMessage(id)

      WebSocket.publishToTask({
        event: 'messageRemoved',
        taskId: this.taskId,
        estateId: this.estateId,
        data: {
          id,
          socket: this.socket.topic
        }
      })
    } catch (err) {
      this.emitError(err.message)
    }
  }

  async onMarkLastRead(data) {
    try {
      const lastChat = await super._markLastRead(this.taskId)
      if (lastChat) {
        WebSocket.publishToTask({
          event: WEBSOCKET_EVENT_TASK_MESSAGE_ALL_READ,
          taskId: this.taskId,
          estateId: this.estateId,
          data: {
            topic: this.socket.topic,
            chat: {
              id: lastChat.id,
              type: data?.type,
              user: lastChat.sender_id,
              created_at: lastChat.created_at
            }
          }
        })
      } else {
        this.emitError(MESSAGE_NOT_SAVED)
      }
    } catch (e) {
      Logger.error(`onMarkLastRead error ${e.message || e}`)
      this.emitError(e.message || e)
    }
  }

  async onMessage(message) {
    try {
      const chat = await this._saveToChats(message, this.taskId)

      const data = {
        message: {
          id: chat.id,
          message: chat.text,
          attachments: await this.getAbsoluteUrl(chat.attachments),
          topic: this.socket.topic,
          dateTime: message.dateTime ? message.dateTime : moment.utc(new Date()).format(),
          sender: {
            id: this.user.id,
            firstname: this.user.firstname,
            secondname: this.user.secondname,
            avatar: this.user.avatar
          }
        },
        sender: {
          userId: this.user.id,
          firstname: this.user.firstname,
          secondname: this.user.secondname,
          avatar: this.user.avatar
        },
        topic: this.socket.topic
      }
      const task = await TaskService.get(this.taskId)
      // broadcast taskMessageReceived event to either tenant or landlord
      // taskMessageReceived represents other side has unread message, in other words, one side sends message, other side has not read this message yet
      const estate = await Estate.query().select('property_id').where('id', this.estateId).first()
      const messageReceivedData = {
        topic: this.socket.topic,
        message: chat.text,
        urgency: task?.urgency,
        estate_id: this.estateId,
        user_id: this.user.id,
        property_id: estate?.property_id,
        sender: {
          id: this.user.id,
          firstname: this.user.firstname,
          secondname: this.user.secondname,
          avatar: this.user.avatar
        }
      }

      if (this.user.role === ROLE_LANDLORD) {
        WebSocket.publishToTenant({
          event: 'taskMessageReceived',
          userId: this.tenant_user_id,
          data: messageReceivedData
        })
      } else {
        WebSocket.publishToLandlord({
          event: 'taskMessageReceived',
          userId: this.estate_user_id,
          data: messageReceivedData
        })
      }

      const recipient = this.user.role === ROLE_LANDLORD ? this.tenant_user_id : this.estate_user_id
      NoticeService.notifyTaskMessageSent(recipient, chat.text, this.taskId, this.user.role)
      if (this.user.role === ROLE_LANDLORD) {
        const recipient = await User.query()
          .select('email', 'lang', 'sex', 'firstname', 'secondname', 'avatar')
          .where('id', this.tenant_user_id)
          .first()
        const estate = await Estate.query().where('id', this.estateId).first()
        if (recipient) {
          await MailService.sendToProspectThatLandlordSentMessage({
            email: recipient.email,
            message: chat.text,
            recipient,
            lang: recipient.lang || DEFAULT_LANG,
            estate_id: this.estateId,
            estate,
            task_id: this.taskId,
            type: task.type,
            topic: `task:${this.estateId}brz${this.taskId}`
          })
        }
      }

      WebSocket.publishToTask({
        event: 'message',
        taskId: this.taskId,
        estateId: this.estateId,
        data: {
          ...data,
          broadcast_all: true
        }
      })

      console.log('instance here=', this instanceof BaseController)
    } catch (e) {
      Logger.error('onMessage error=', e.message)
      this.emitError(e.message || MESSAGE_NOT_SAVED)
    }
  }
}

module.exports = TaskController
