'use strict'
const BaseController = require('./BaseController')
const Chat = use('App/Models/Chat')
const Database = use('Database')
const { min } = require('lodash')
const {
  CONNECT_PREVIOUS_MESSAGES_LIMIT_PER_PULL,
  CHAT_TYPE_MESSAGE,
  CHAT_TYPE_LAST_READ_MARKER,
} = require('../../constants')

class TaskController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
    const matches = this.socket.topic.match(/^task:[0-9]+brz([0-9]+)$/)
    this.taskId = matches[1]
  }

  async onGetPreviousMessages({ lastId = 0 }) {
    const query = Chat.query()
      .select('chats.id as id')
      .select('text as message')
      .select('attachments')
      .select('created_at as dateTime')
      .select(Database.raw(`senders.sender`))
      .leftJoin(
        Database.raw(`(select id,
        json_build_object('id', users.id, 'firstname', users.firstname, 
          'secondname', users.secondname, 'avatar', users.avatar
        ) as sender
        from users group by id) as senders`),
        'senders.id',
        'chats.sender_id'
      )
      .where({
        type: CHAT_TYPE_MESSAGE,
        task_id: this.taskId,
      })
      .orderBy('created_at', 'desc')
      .limit(CONNECT_PREVIOUS_MESSAGES_LIMIT_PER_PULL)
    if (lastId) {
      query.where('chats.id', '<', lastId)
    }
    let lastMessages = await query.fetch()

    //for unread messages
    let counts = []
    const allCount = await Chat.query()
      .select(Database.raw(`count(*) as unread_messages`))
      .where('task_id', this.taskId)
      .where('type', CHAT_TYPE_MESSAGE)
      .first()

    if (allCount) {
      counts.push(parseInt(allCount.unread_messages))
    }

    const unreadByMarker = await Chat.query()
      .select(Database.raw(`count(*) as unread_messages`))
      .where(
        'created_at',
        '>',
        Database.raw(
          `(select created_at from chats
            where "type"='${CHAT_TYPE_LAST_READ_MARKER}'
            and task_id='${this.taskId}'
            order by created_at desc
            limit 1
            )`
        )
      )
      .where('task_id', this.taskId)
      .where('type', CHAT_TYPE_MESSAGE)
      .first()
    if (unreadByMarker) {
      counts.push(parseInt(unreadByMarker.unread_messages))
    }

    const unreadByLastSent = await Chat.query()
      .select(Database.raw(`count(*) as unread_messages`))
      .where(
        'created_at',
        '>',
        Database.raw(
          `(select created_at from chats
            where "type"='${CHAT_TYPE_MESSAGE}'
            and "sender_id"='${this.user.id}'
            and task_id='${this.taskId}'
            order by created_at desc
            limit 1)`
        )
      )
      .where('task_id', this.taskId)
      .where('type', CHAT_TYPE_MESSAGE)
      .first()
    if (unreadByLastSent) {
      counts.push(parseInt(unreadByLastSent.unread_messages))
    }
    const unreadMessages = min(counts)
    if (this.topic) {
      this.topic.emitTo(
        'previousMessages',
        {
          messages: lastMessages,
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
