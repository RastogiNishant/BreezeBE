'use strict'

const ChatService = use('App/Services/ChatService')
const File = use('App/Classes/File')

class ChatController {
  async getByTaskId({ request, auth, response }) {
    const data = request.all()

    let lastId = 0

    if (data && data.lastId) {
      lastId = data.lastId
    }

    const previousMessages = await this.getItemsWithAbsoluteUrl(
      (
        await ChatService.getPreviousMessages({
          task_id: data.task_id,
          lastId,
          user_id: auth.user.id,
          page: data.page,
          limit: data.limit,
        })
      ).rows
    )

    const unreadMessages = await ChatService.getUnreadMessagesCount(data.task_id, auth.user.id)

    response.res({
      messages: previousMessages,
      unread: unreadMessages,
    })
  }

  async getAbsoluteUrl(attachments) {
    if (!attachments || !attachments.length) {
      return null
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
  }
  async getItemsWithAbsoluteUrl(items) {
    if (!items || !items.length) {
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

module.exports = ChatController
