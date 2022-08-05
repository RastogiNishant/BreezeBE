'use strict'
const Chat = use('App/Models/Chat')
const Database = use('Database')
const {
  CHAT_TYPE_LAST_READ_MARKER,
  CHAT_TYPE_MESSAGE,
  CONNECT_PREVIOUS_MESSAGES_LIMIT_PER_PULL,
  CONNECT_MESSAGE_EDITABLE_TIME_LIMIT,
  CHAT_EDIT_STATUS_EDITED,
  CHAT_EDIT_STATUS_DELETED,
  CHAT_TYPE_BOT_MESSAGE,  
  STATUS_ACTIVE,
  TASK_STATUS_RESOLVED,
  TASK_STATUS_CLOSED,
  TASK_STATUS_DRAFT,
  TASK_STATUS_DELETE,
  ROLE_LANDLORD,
  ROLE_USER,
  ISO_DATE_FORMAT,  
} = require('../constants')
const { min, isBoolean } = require('lodash')
const Task = use('App/Models/Task')
const Promise = require('bluebird')
const HttpException = use('App/Exceptions/HttpException')
const AppException = use('App/Exceptions/AppException')
class ChatService {
  static async markLastRead(userId, taskId) {
    const trx = await Database.beginTransaction()
    try {
      await Chat.query()
        .where({
          type: CHAT_TYPE_LAST_READ_MARKER,
          sender_id: userId,
          task_id: taskId,
        })
        .delete()
        .transacting(trx)

      await Chat.query().insert(
        {
          type: CHAT_TYPE_LAST_READ_MARKER,
          sender_id: userId,
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

  static async save(message, userId, taskId) {
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
    data.sender_id = userId
    data.type = CHAT_TYPE_MESSAGE
    const chat = await Chat.create(data)
    return chat
  }

  static async getPreviousMessages(taskId, lastId) {
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
        task_id: taskId,
      })
      .whereIn('type', [CHAT_TYPE_MESSAGE, CHAT_TYPE_BOT_MESSAGE])
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .limit(CONNECT_PREVIOUS_MESSAGES_LIMIT_PER_PULL)
    if (lastId) {
      query.where('chats.id', '<', lastId)
    }
    let lastMessages = await query.fetch()
    return lastMessages
  }

  static async getUnreadMessagesCount(taskId, userId) {
    //for unread messages
    let counts = []
    const allCount = await Chat.query()
      .select(Database.raw(`count(*) as unread_messages`))
      .where('task_id', taskId)
      .where('type', CHAT_TYPE_MESSAGE)
      .first()
    if (allCount) {
      if (parseInt(allCount.unread_messages) === 0) return 0
      counts.push(parseInt(allCount.unread_messages))
    }

    const lastReadMarkerDate = await Chat.query()
      .select(Database.raw(`to_char(created_at, '${ISO_DATE_FORMAT}') as created_at`))
      .where('type', CHAT_TYPE_LAST_READ_MARKER)
      .where('task_id', taskId)
      .where('sender_id', userId)
      .orderBy('created_at', 'desc')
      .first()

    if (lastReadMarkerDate) {
      const unreadByMarker = await Chat.query()
        .select(Database.raw(`count(*) as unread_messages`))
        .where('created_at', '>', lastReadMarkerDate.created_at)
        .where('task_id', taskId)
        .whereIn('type', [CHAT_TYPE_MESSAGE, CHAT_TYPE_BOT_MESSAGE])
        .first()
      if (unreadByMarker) {
        counts.push(parseInt(unreadByMarker.unread_messages))
      }
    }

    const lastSentDate = await Chat.query()
      .select(Database.raw(`to_char(created_at, '${ISO_DATE_FORMAT}') as created_at`))
      .whereIn('type', [CHAT_TYPE_MESSAGE, CHAT_TYPE_BOT_MESSAGE])
      .where('task_id', taskId)
      .where('sender_id', userId)
      .orderBy('created_at', 'desc')
      .first()

    if (lastSentDate) {
      const unreadByLastSent = await Chat.query()
        .select(Database.raw(`count(*) as unread_messages`))
        .where('created_at', '>', lastSentDate.created_at)
        .where('task_id', taskId)
        .whereIn('type', [CHAT_TYPE_MESSAGE, CHAT_TYPE_BOT_MESSAGE])
        .first()
      if (unreadByLastSent) {
        counts.push(parseInt(unreadByLastSent.unread_messages))
      }
    }
    const unreadMessagesCount = min(counts)
    return unreadMessagesCount
  }

  static async getChatMessageAge(id) {
    let ret = await Chat.query()
      .select('*', Database.raw(`extract(EPOCH from (now() - created_at)) as difference`))
      .where('id', id)
      .first()
    return ret
  }

  static async updateChatMessage({ id, message, attachments }, trx) {
    const query = Chat.query()
      .where('id', id)
      .where('type', CHAT_TYPE_MESSAGE)
      .update({
        text: message,
        attachments: attachments ? JSON.stringify(attachments) : null,
        edit_status: CHAT_EDIT_STATUS_EDITED,
      })

    if (!trx) {
      return await query
    }
    return query.transacting(trx)
  }

  static async removeChatMessage(id) {
    const result = await Chat.query()
      .where('id', id)
      .update({ text: '', attachments: null, edit_status: CHAT_EDIT_STATUS_DELETED })
    return result
  }

  static async getUserUnreadMessagesByTopic(userId, role) {
    let taskEstates
    let query = Task.query()
      .select('tasks.id as task_id', 'estates.id as estate_id')
      .leftJoin('estates', 'estates.id', 'tasks.estate_id')
      .leftJoin('estate_current_tenants', function () {
        this.on('tasks.tenant_id', 'estate_current_tenants.user_id').on(
          'estate_current_tenants.estate_id',
          'estates.id'
        )
      })
      .whereNotIn('tasks.status', [
        TASK_STATUS_RESOLVED,
        TASK_STATUS_DRAFT,
        TASK_STATUS_CLOSED,
        TASK_STATUS_DELETE,
      ])
      .where('estate_current_tenants.status', STATUS_ACTIVE)
    if (role === ROLE_LANDLORD) {
      query.where('estates.user_id', userId)
    } else if (role === ROLE_USER) {
      query.where('estate_current_tenants.user_id', userId)
    }
    taskEstates = await query.fetch()
    const unreadMessagesByTopic = await Promise.reduce(
      taskEstates.toJSON(),
      async (unreadMessagesByTopic, taskEstate) => {
        const unreadMessagesCount = await ChatService.getUnreadMessagesCount(
          taskEstate.task_id,
          userId
        )
        return [
          ...unreadMessagesByTopic,
          {
            topic: `task:${taskEstate.estate_id}brz${taskEstate.task_id}`,
            unread: unreadMessagesCount,
          },
        ]
      },
      []
    )
    return unreadMessagesByTopic
  }

  static async editMessage({ message, attachments, id }) {
    const trx = await Database.beginTransaction()
    try {
      let messageAge = await ChatService.getChatMessageAge(id)
      if (isBoolean(messageAge) && !messageAge) {
        throw new AppException('Chat message not found.')
      }
      if (messageAge > CONNECT_MESSAGE_EDITABLE_TIME_LIMIT) {
        throw new AppException('Chat message not editable anymore.')
      }
      await ChatService.updateChatMessage({ id, message, attachments })
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e)
    }
  }
}

module.exports = ChatService
