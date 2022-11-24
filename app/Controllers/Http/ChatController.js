'use strict'

const ChatService = use('App/Services/ChatService')
const HttpException = use('App/Exceptions/HttpException')
class ChatController {
  async getByTaskId({ request, auth, response }) {
    const data = request.all()

    let lastId = 0

    if (data && data.lastId) {
      lastId = data.lastId
    }

    const previousMessages = await ChatService.getItemsWithAbsoluteUrl(
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
    response.res(previousMessages || [])
  }

  async getUnreadMessages({ request, auth, response }) {
    try {
      response.res(await ChatService.getUserUnreadMessagesByTopic(auth.user.id, auth.user.role))
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }
}

module.exports = ChatController
