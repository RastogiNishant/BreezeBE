'use strict'
const TaskService = use('App/Services/TaskService')
const HttpException = use('App/Exceptions/HttpException')
class TaskController {
  async createTask({ request, auth, response }) {
    try {
      const { estate_id } = request.all()
      if( await TaskService.hasPermission({estate:estate_id, user_id: auth.user.id, role: auth.user.role})){
        response.res(await TaskService.create(request))
      }
      response.res('Permission error', 500)
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async addPhotos({ request, auth, response }) {

  }

  async updateTask({ request, auth, response }) {
    const { ...data } = request.all()
    try {
      if( await TaskService.hasPermission({estate:data.estate_id, user_id: auth.user.id, role: auth.user.role})){
        data = {
          ...data,
          create_role:auth.user.role
        }
        response.res(await TaskService.update(data.id, data))
      }
      response.res('Permission error', 500)

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
