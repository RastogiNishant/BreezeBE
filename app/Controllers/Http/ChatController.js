'use strict'

const ChatService = use('App/Services/ChatService')

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
          page: data.page,
          limit: data.limit,
        })
      ).rows
    )
    response.res(previousMessages || [])
  }
}

module.exports = ChatController
