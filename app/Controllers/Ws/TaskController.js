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
} = require('../../constants')

const {
  exceptions: { MESSAGE_NOT_SAVED },
} = require('../../excepions')
const BaseController = require('./BaseController')
const AppException = use('App/Exceptions/AppException')
const ChatService = use('App/Services/ChatService')
const TaskService = use('App/Services/TaskService')
const Task = use('App/Models/Task')
const { isBoolean } = require('lodash')
const NoticeService = use('App/Services/NoticeService')
const moment = require('moment')

class TaskController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
    this.taskId = request.task_id
    this.estateId = request.estate_id
    this.tenant_user_id = request.tenant_user_id
    this.estate_user_id = request.estate_user_id
  }

  async onGetPreviousMessages(data) {
    let lastId = 0

    if (data && data.lastId) {
      lastId = data.lastId
    }
    let previousMessages = await ChatService.getPreviousMessages({
      task_id: this.taskId,
      lastId,
      user_id: this.user.id,
    })
    previousMessages = await super.getItemsWithAbsoluteUrl(previousMessages.toJSON())
    if (this.topic) {
      this.topic.emitTo(
        'previousMessages',
        {
          messages: previousMessages,
          topic: this.socket.topic,
        },
        [this.socket.id]
      )
    }
  }

  async onEditMessage({ message, attachments, id }) {
    try {
      let messageAge = await ChatService.getChatMessageAge(id)
      if (isBoolean(messageAge) && !messageAge) {
        throw new AppException('Chat message not found.')
      }
      if (messageAge > CONNECT_MESSAGE_EDITABLE_TIME_LIMIT) {
        throw new AppException('Chat message not editable anymore.')
      }
      await ChatService.updateChatMessage({ id, message, attachments })
      attachments = await this.getAbsoluteUrl(attachments)
      if (this.topic) {
        this.topic.broadcast('messageEdited', {
          id,
          message: message,
          attachments: attachments,
          edit_status: CHAT_EDIT_STATUS_EDITED,
          topic: this.socket.topic,
        })
      }
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
      if (this.topic) {
        this.topic.broadcast('messageRemoved', { id, socket: this.socket.topic })
      }
    } catch (err) {
      this.emitError(err.message)
    }
  }

  async onMarkLastRead() {
    const lastChat = await super._markLastRead(this.taskId)
    if (lastChat) {
      this.broadcastToTopic(this.socket.topic, WEBSOCKET_EVENT_TASK_MESSAGE_ALL_READ, {
        topic: this.socket.topic,
        chat: {
          id: lastChat.id,
          user: lastChat.sender_id,
          created_at: lastChat.created_at,
        },
      })
    } else {
      this.emitError(MESSAGE_NOT_SAVED)
    }
  }

  async onMessage(message) {
    //FIXME: make slim controller
    const task = await TaskService.getTaskById({ id: this.taskId, user: this.user })
    if (this.user.role === ROLE_LANDLORD) {
      //we check whether this is in progress

      if ([TASK_STATUS_NEW, TASK_STATUS_RESOLVED, TASK_STATUS_UNRESOLVED].includes(task.status)) {
        //if in progress make it TASK_STATUS_NEW
        await Task.query().where('id', this.taskId).update({ status: TASK_STATUS_INPROGRESS })
        if (this.topic) {
          //Broadcast to those listening to this channel...
          this.topic.broadcast('taskStatusUpdated', {
            status: TASK_STATUS_INPROGRESS,
            topic: this.socket.topic,
          })
        }
      }
    }

    const chat = await this._saveToChats(message, this.taskId)
    if (chat) {
      message.id = chat.id
      message.message = chat.text
      message.attachments = await this.getAbsoluteUrl(chat.attachments)
      message.sender = {
        id: this.user.id,
        firstname: this.user.firstname,
        secondname: this.user.secondname,
        avatar: this.user.avatar,
      }
      message.topic = this.socket.topic
      const recipientTopic =
        this.user.role === ROLE_LANDLORD
          ? `tenant:${this.tenant_user_id}`
          : `landlord:${this.estate_user_id}`

      //broadcast taskMessageReceived event to either tenant or landlord
      this.broadcastToTopic(recipientTopic, 'taskMessageReceived', {
        topic: this.socket.topic,
        urgency: task?.urgency,
      })
      const recipient = this.user.role === ROLE_LANDLORD ? this.tenant_user_id : this.estate_user_id
      await NoticeService.notifyTaskMessageSent(recipient, chat.text, this.taskId, this.user.role)
      super.onMessage(message)
    } else {
      this.emitError(MESSAGE_NOT_SAVED)
    }
  }
}

module.exports = TaskController
