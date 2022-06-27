'use strict'

const TaskService = use('App/Services/TaskService')
const HttpException = use('App/Exceptions/HttpException')
class TaskController {
  async createTask({ request, auth, response }) {
    try {
      response.res(await TaskService.create(request, auth.user))
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async addImage({ request, auth, response }) {
    response.res(await TaskService.addImages(request, auth.user))
  }

  async removeImage({ request, auth, response }) {
    const { id, uri } = request.all()
    response.res(await TaskService.removeImages({ id, uri, user: auth.user }))
  }

  async updateTask({ request, auth, response }) {
    const { ...data } = request.all()
    try {
      response.res(await TaskService.update({ user: auth.user, task: data }))
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async deleteTask({ request, auth, response }) {
    const { id, estate_id } = request.all()
    response.res(await TaskService.delete({ id, estate_id, user: auth.user }))
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
