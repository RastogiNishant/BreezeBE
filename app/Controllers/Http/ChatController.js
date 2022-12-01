'use strict'
const TaskService = use('App/Services/TaskService')
const ChatService = use('App/Services/ChatService')
const HttpException = use('App/Exceptions/HttpException')

class ChatController {
  async getByTaskId({ request, auth, response }) {
    const data = request.all()

    let lastId = 0

    if (data && data.lastId) {
      lastId = data.lastId
    }

    const task = await TaskService.getTaskById({ id: data.task_id, user: auth.user })
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
    response.res({
      task,
      chats: previousMessages || [],
    })
  }

  async getUnreadMessages({ request, auth, response }) {
    try {
      response.res(await ChatService.getUserUnreadMessages(auth.user.id, auth.user.role))
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }
}

module.exports = ChatController
