'use strict'
const BaseController = require('./BaseController')
const ChatService = use('App/Services/ChatService')
const { isEmpty } = require('lodash')
const HttpException = use('App/Exceptions/HttpException')

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

  async onMarkLastRead() {
    super._markLastRead(this.taskId)
  }

  async onMessage(message) {
    //FIXME: make slim controller
    let task
    if (this.user.role === ROLE_LANDLORD) {
      //we check whether this is in progress
      task = await TaskService.getTaskById({ id: this.taskId, user: this.user })

      if (
        task.status === TASK_STATUS_NEW ||
        task.status === TASK_STATUS_RESOLVED ||
        task.status === TASK_STATUS_UNRESOLVED
      ) {
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
    message.id = chat.id
    message.message = chat.text
    message.attachments = chat.attachments
    message.sender = {
      id: this.user.id,
      firstname: this.user.firstname,
      secondname: this.user.secondname,
      avatar: this.user.avatar,
    }
    super.onMessage(message)
  }
}

module.exports = TaskController
