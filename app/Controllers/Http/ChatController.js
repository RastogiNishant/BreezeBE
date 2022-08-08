'use strict'

class ChatController {
  async onGetPreviousMessages({ request, auth, response }) {
    const data = request.all()

    let lastId = 0

    if (data && data.lastId) {
      lastId = data.lastId
    }
    const previousMessages = await this.getItemsWithAbsoluteUrl(
      (
        await ChatService.getPreviousMessages(this.taskId, lastId)
      ).rows
    )

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

  static async getAbsoluteUrl(attachments) {
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
  static async getItemsWithAbsoluteUrl(items) {
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
