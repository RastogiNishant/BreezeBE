'use strict'
const Chat = use('App/Models/Chat')
const Database = use('Database')
const File = use('App/Classes/File')

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
  TASK_STATUS_DRAFT,
  TASK_STATUS_DELETE,
  ROLE_LANDLORD,
  ROLE_USER,
  ISO_DATE_FORMAT,
  STATUS_DELETE,
  LETTING_TYPE_LET,
} = require('../constants')
const { min, isBoolean, isArray } = require('lodash')
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

      await Chat.create(
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
    if (typeof message === 'object' && typeof message.message === 'string') {
      data.text = message.message
    } else if (typeof message === 'object') {
      //message.message is not defined
      data.text = ''
    } else {
      data.text = message
    }

    if (message.attachments && !isArray(message.attachments)) {
      return {
        success: false,
        message: 'Attachments must be an array',
      }
    }

    data.attachments = message.attachments ? JSON.stringify(message.attachments) : null
    data.task_id = taskId
    data.sender_id = userId
    data.type = CHAT_TYPE_MESSAGE
    const chat = await Chat.create(data)
    return chat
  }

  static async getPreviousMessages({ task_id, lastId, user_id, page = -1, limit = -1 }) {
    const query = Chat.query()
      .select('chats.id as id')
      .select('text as message')
      .select('attachments')
      .select('created_at as dateTime')
      .select(Database.raw(`senders.sender`))
      .select('_t.urgency')
      .leftJoin(
        Database.raw(`(select id,
        json_build_object('id', users.id, 'firstname', users.firstname, 
          'secondname', users.secondname, 'avatar', users.avatar
        ) as sender
        from users group by id) as senders`),
        'senders.id',
        'chats.sender_id'
      )
      .leftJoin(
        Database.raw(`(
        select id, urgency from tasks where id='${task_id}'
      ) as _t`),
        function () {
          this.on('_t.id', 'chats.task_id').on('_t.id', task_id)
        }
      )
      .where({
        task_id: task_id,
      })
      .whereIn('type', [CHAT_TYPE_MESSAGE, CHAT_TYPE_BOT_MESSAGE])
      .whereNot('edit_status', CHAT_EDIT_STATUS_DELETED)
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')

    if (limit !== -1) {
      query.limit(limit)
    } else {
      query.limit(CONNECT_PREVIOUS_MESSAGES_LIMIT_PER_PULL)
    }

    if (lastId) {
      query.where('chats.id', '<', lastId)
    }
    let lastMessages = await query.fetch()
    return lastMessages
  }

  static async getUnreadMessagesCount(taskId, userId) {
    //for unread messages
    let counts = []

    const lastReadMarkerDate = await Chat.query()
      .select(Database.raw(`to_char(created_at, '${ISO_DATE_FORMAT}') as created_at`))
      .where('type', CHAT_TYPE_LAST_READ_MARKER)
      .where('task_id', taskId)
      .where('sender_id', userId)
      .orderBy('created_at', 'desc')
      .first()

    const lastSentDate = await Chat.query()
      .select(Database.raw(`to_char(created_at, '${ISO_DATE_FORMAT}') as created_at`))
      .whereIn('type', [CHAT_TYPE_MESSAGE, CHAT_TYPE_BOT_MESSAGE])
      .whereNot('edit_status', CHAT_EDIT_STATUS_DELETED)
      .where('task_id', taskId)
      .where('sender_id', userId)
      .orderBy('created_at', 'desc')
      .first()

    let count = 0
    if (lastReadMarkerDate && lastSentDate) {
      if (lastReadMarkerDate.created_at >= lastSentDate.created_at) {
        //we're going to count the messages after lastReadMarkerDate
        const unreadByMarker = await Chat.query()
          .select(Database.raw(`count(*) as unread_messages`))
          .where(
            Database.raw(`to_char(created_at, '${ISO_DATE_FORMAT}')`),
            '>',
            lastReadMarkerDate.created_at
          )
          .where('task_id', taskId)
          .whereIn('type', [CHAT_TYPE_MESSAGE, CHAT_TYPE_BOT_MESSAGE])
          .whereNot('edit_status', CHAT_EDIT_STATUS_DELETED)
          .first()
        count = parseInt(unreadByMarker?.unread_messages || 0)
      } else {
        const unreadByLastSent = await Chat.query()
          .select(Database.raw(`count(*) as unread_messages`))
          .where(
            Database.raw(`to_char(created_at, '${ISO_DATE_FORMAT}')`),
            '>',
            lastSentDate.created_at
          )
          .where('task_id', taskId)
          .whereIn('type', [CHAT_TYPE_MESSAGE, CHAT_TYPE_BOT_MESSAGE])
          .whereNot('edit_status', CHAT_EDIT_STATUS_DELETED)
          .first()
        count = parseInt(unreadByLastSent?.unread_messages || 0)
      }
    } else if (lastReadMarkerDate && !lastSentDate) {
      const unreadByLastSent = await Chat.query()
        .select(Database.raw(`count(*) as unread_messages`))
        .where(
          Database.raw(`to_char(created_at, '${ISO_DATE_FORMAT}')`),
          '>',
          lastReadMarkerDate.created_at
        )
        .where('task_id', taskId)
        .whereIn('type', [CHAT_TYPE_MESSAGE, CHAT_TYPE_BOT_MESSAGE])
        .whereNot('edit_status', CHAT_EDIT_STATUS_DELETED)
        .first()
      count = parseInt(unreadByLastSent.unread_messages)
    } else if (!lastReadMarkerDate && lastSentDate) {
      const unreadByMarker = await Chat.query()
        .select(Database.raw(`count(*) as unread_messages`))
        .where(
          Database.raw(`to_char(created_at, '${ISO_DATE_FORMAT}')`),
          '>',
          lastSentDate.created_at
        )
        .where('task_id', taskId)
        .whereIn('type', [CHAT_TYPE_MESSAGE, CHAT_TYPE_BOT_MESSAGE])
        .whereNot('edit_status', CHAT_EDIT_STATUS_DELETED)
        .first()
      count = parseInt(unreadByMarker?.unread_messages || 0)
    } else {
      const allCount = await Chat.query()
        .select(Database.raw(`count(*) as unread_messages`))
        .where('task_id', taskId)
        .whereIn('type', [CHAT_TYPE_MESSAGE, CHAT_TYPE_BOT_MESSAGE])
        .whereNot('edit_status', CHAT_EDIT_STATUS_DELETED)
        .first()
      count = parseInt(allCount?.unread_messages || 0)
    }
    return count
  }

  static async getChatMessageAge(id) {
    let ret = await Chat.query()
      .select(Database.raw(`extract(EPOCH from (now() - created_at)) as difference`))
      .where('id', id)
      .first()
    return ret
  }

  static async updateChatMessage({ id, message, attachments }, trx) {
    const query = Chat.query()
      .where('id', id)
      .whereIn('type', [CHAT_TYPE_MESSAGE, CHAT_TYPE_BOT_MESSAGE])
      .whereNot('edit_status', CHAT_EDIT_STATUS_DELETED)
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

  /**
   * This function doesn't have to be called from controller directly without checking permission
   * @param {*} taskIds
   * @param {*} trx
   * @returns
   */
  static async removeChatsByTaskIds(taskIds, trx) {
    return await Chat.query()
      .whereIn('task_id', taskIds)
      .update({ text: '', attachments: null, edit_status: CHAT_EDIT_STATUS_DELETED })
      .transacting(trx)
  }
  static async removeChatMessage(id) {
    const result = await Chat.query()
      .where('id', id)
      .update({ edit_status: CHAT_EDIT_STATUS_DELETED })
    return result
  }

  static async getUserUnreadMessagesByTopic(userId, role) {
    let taskEstates

    let query = Task.query()
      .select('tasks.id as task_id', 'estates.id as estate_id', 'tasks.urgency')
      .innerJoin('estates', function () {
        this.on('estates.id', 'tasks.estate_id')
          .onNotIn('estates.status', [STATUS_DELETE])
          .on('estates.letting_type', LETTING_TYPE_LET)
      })
      .innerJoin('estate_current_tenants', function () {
        this.on('estate_current_tenants.estate_id', 'estates.id').on(
          'estate_current_tenants.status',
          STATUS_ACTIVE
        )
      })
      .whereNotIn('tasks.status', [TASK_STATUS_DRAFT, TASK_STATUS_DELETE])

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
            urgency: taskEstate?.urgency,
            unread: unreadMessagesCount,
          },
        ]
      },
      []
    )
    return unreadMessagesByTopic
  }

  static async getAbsoluteUrl(attachments) {
    try {
      if (!attachments || !attachments.length) {
        return null
      }
      if (!isArray(attachments)) {
        attachments = JSON.parse(attachments)
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
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }
  static async getItemsWithAbsoluteUrl(items) {
    if (!items || !items.length) {
      return null
    }
    try {
      items = await Promise.all(
        (items = items.map(async (item) => {
          if (item.attachments) {
            item.attachments = await ChatService.getAbsoluteUrl(item.attachments)
          }
          return item
        }))
      )
      return items
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  static async editMessage({ message, attachments, id }) {
    try {
      const chat = await ChatService.getChatMessageAge(id)
      const messageAge = chat?.difference || false

      if (isBoolean(messageAge) && !messageAge) {
        throw new AppException('Chat message not found.')
      }
      if (messageAge > CONNECT_MESSAGE_EDITABLE_TIME_LIMIT) {
        throw new AppException('Chat message not editable anymore.')
      }
      await ChatService.updateChatMessage({ id, message, attachments })
    } catch (e) {
      throw new HttpException(e)
    }
  }
}

module.exports = ChatService