'use strict'
const {
  CONNECT_MESSAGE_EDITABLE_TIME_LIMIT,
  ROLE_LANDLORD,
  CHAT_EDIT_STATUS_EDITED,
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_NEW,
} = require('../../constants')

const BaseController = require('./BaseController')
const AppException = use('App/Exceptions/AppException')
const ChatService = use('App/Services/ChatService')
const TaskService = use('App/Services/TaskService')
const Task = use('App/Models/Task')
const { isBoolean } = require('lodash')

class TaskController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
    this.taskId = request.task_id
  }

  async onGetPreviousMessages({ lastId = 0 }) {
    const previousMessages = await ChatService.getPreviousMessages(this.taskId, lastId)
    const unreadMessages = await ChatService.getUnreadMessagesCount(this.taskId, this.user.id)
    if (this.topic) {
      this.topic.emitTo(
        'previousMessages',
        {
          messages: previousMessages,
          topic: this.socket.topic,
          unread: unreadMessages,
        },
        [this.socket.id]
      )
    }
  }

  async onEditMessage({ message, attachments, id, predefined_message_answer_id, choice_id }) {
    try {
      await ChatService.editMessage({
        message,
        attachments,
        id,
        predefined_message_answer_id,
        choice_id,
      })

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
    super._markLastRead(this.taskId)
  }

  async onMessage(message) {
    let task
    if (this.user.role === ROLE_LANDLORD) {
      //we check whether this is in progress
      task = await TaskService.getTaskById({ id: this.taskId, user: this.user })
      if (task.status === TASK_STATUS_INPROGRESS) {
        //if in progress make it TASK_STATUS_NEW
        await Task.query().where('id', this.taskId).update({ status: TASK_STATUS_NEW })
        if (this.topic) {
          //Broadcast to those listening to this channel...
          this.topic.broadcast('taskStatusUpdated', {
            status: TASK_STATUS_NEW,
            topic: this.socket.topic,
          })
        }
      }
    }
    const chat = await this._saveToChats(message, this.taskId)
    message.id = chat.id
    message.message = chat.text
    message.attachments = chat.attachments
    message.sender = {
      id: this.user.id,
      firstname: this.user.firstname,
      secondname: this.user.secondname,
      avatar: this.user.avatar,
    }
    message.topic = this.socket.topic
    super.onMessage(message)
  }
}

module.exports = TaskController
