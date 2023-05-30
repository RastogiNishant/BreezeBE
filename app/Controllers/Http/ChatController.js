'use strict'
const TaskService = use('App/Services/TaskService')
const ChatService = use('App/Services/ChatService')
const HttpException = use('App/Exceptions/HttpException')
const {
  exceptions: { NO_TASK_FOUND },
} = require('../../exceptions')
class ChatController {
  async getByTaskId({ request, auth, response }) {
    const data = request.all()
    let lastId = 0

    if (data && data.lastId) {
      lastId = data.lastId
    }

    const task = await TaskService.getTaskById({
      id: data.task_id,
      estate_id: data.estate_id,
      prospec_id: data.prospec_id,
      user: auth.user,
    })

    if (!task) {
      throw new HttpException(NO_TASK_FOUND, 400)
    }
    const previousMessages = await ChatService.getItemsWithAbsoluteUrl(
      (
        await ChatService.getPreviousMessages({
          task_id: data.task_id || task.id,
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
