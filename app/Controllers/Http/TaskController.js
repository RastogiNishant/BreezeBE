'use strict'
const { ROLE_LANDLORD } = require('../../constants')
const { count } = require('../../Services/TaskService')
const TaskService = use('App/Services/TaskService')
const EstateService = use('App/Services/EstateService')
const HttpException = use('App/Exceptions/HttpException')
const moment = require('moment')

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

  async getTenantTasks({ request, auth, response }) {
    try {
      response.res(await TaskService.getTenantAllTask({ tenant_id: auth.user.id }))
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async getEstateTasks({ request, auth, response }) {
    const params = request.post()
    const { id } = request.all()
    let estate = await EstateService.getEstateWithTenant(id, auth.user.id)

    const estateAllTasks = await TaskService.getEstateAllTasks(
      auth.user,
      id,
      params,
      params.page || -1,
      params.limit || -1
    )

    let archivedCount = null
    if (params.archived_status) {
      archivedCount = await TaskService.count({
        estate_id: id,
        status: params.archived_status,
        role: ROLE_LANDLORD,
      })
    }

    estate = {
      ...estate.toJSON(),
      tasks: estateAllTasks,
      archivedCount: !params.archived_status
        ? undefined
        : archivedCount && archivedCount.length
        ? archivedCount[0].count
        : 0,
    }
    response.res(estate)
  }

  async getLandlordTasks({ request, auth, response }) {
    const params = request.post()

    try {
      const countResult = await EstateService.getTotalLetCount(auth.user.id, params)
      let estate = await EstateService.getEstatesWithTask(
        auth.user,
        params,
        params.page || -1,
        params.limit || -1
      )
      const result = {
        total: countResult.length || 0,
        estates: estate,
      }

      response.res(result)
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
