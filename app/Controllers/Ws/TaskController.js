'use strict'
const { CONNECT_MESSAGE_EDITABLE_TIME_LIMIT } = require('../../constants')
const BaseController = require('./BaseController')
const Chat = use('App/Models/Chat')
const Database = use('Database')
const AppException = use('App/Exceptions/AppException')
const ChatService = use('App/Services/ChatService')

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

  async onEditMessage({ message, attachments, id }) {
    try {
      let result = await Chat.query()
        .select(Database.raw(`extract(EPOCH from (now() - created_at)) as difference`))
        .where('id', id)
        .first()
      if (!result) {
        throw new AppException('Chat message not found.')
      }
      if (result.difference > CONNECT_MESSAGE_EDITABLE_TIME_LIMIT) {
        throw new AppException('Chat message not editable anymore.')
      }
      result = await Chat.query()
        .where('id', id)
        .update({ text: message, attachments: JSON.stringify(attachments) })
      if (this.topic) {
        this.topic.broadcast('messageEdited', {
          id,
          message: message,
          attachments: attachments,
          edit_status: 'edited',
          topic: this.socket.topic,
        })
      }
    } catch (err) {
      this.emitError(err.message)
    }
  }

  async onRemoveMessage({ id }) {
    try {
      let result = await Chat.query()
        .select(Database.raw(`extract(EPOCH from (now() - created_at)) as difference`))
        .where('id', id)
        .first()

      if (!result) {
        throw new AppException('Chat message not found.')
      }
      if (result.difference > CONNECT_MESSAGE_EDITABLE_TIME_LIMIT) {
        throw new AppException('Chat message not editable anymore.')
      }
      result = await Chat.query()
        .where('id', id)
        .update({ text: '', attachments: null, edit_status: 'deleted' })
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
