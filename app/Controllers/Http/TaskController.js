'use strict'
const TaskService = use('App/Services/TaskService')
const HttpException = use('App/Exceptions/HttpException')
class TaskController {
  async createTask({ request, auth, response }) {
    try {
      response.res(await TaskService.create(request))
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async updateTask({ request, auth, response }) {
    const { ...data } = request.all()
    try {
      return await TaskService.update(data.id, data)
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async getTask({ request, auth, response }) {
    const { ...filter } = request.all()
    try {
      return await TaskService.getAll(filter)
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }
}

module.exports = TaskController
