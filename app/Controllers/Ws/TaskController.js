'use strict'
const BaseController = require('./BaseController')
const Chat = use('App/Models/Chat')
const { reverse } = require('lodash')
const Database = use('Database')

class TaskController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
    const matches = this.socket.topic.match(/^task:[0-9]+brz([0-9]+)$/)
    this.taskId = matches[1]
  }

  //this is not needed anymore...
  onTaskInit() {
    let count = 0
    let doMore = true
    let qs = []
    do {
      if (origQuestions[count].type !== 'not-a-question') {
        doMore = false
      }
      qs.push(origQuestions[count])
      count++
    } while (doMore)
    this.broadcast(qs, 'question', 0)
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
        type: 'message',
        task_id: this.taskId,
      })
      .orderBy('created_at', 'desc')
      .limit(10)
    if (lastId) {
      query.where('id <', lastId)
    }
    let lastMessages = await query.fetch()
    //for unread messages
    const result = await Chat.query()
      .select(Database.raw(`count(*) as unread_messages`))
      .where(
        'created_at',
        '>',
        Database.raw(
          `(select created_at from chats where "type"='last-read-marker' and task_id='${this.taskId}')`
        )
      )
      .where('task_id', this.taskId)
      .where('type', 'message')
      .first()

    if (this.topic) {
      this.topic.emitTo(
        'previousMessages',
        {
          messages: lastMessages,
          topic: this.socket.topic,
          unread: parseInt(result.unread_messages),
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
