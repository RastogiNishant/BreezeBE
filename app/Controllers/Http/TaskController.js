'use strict'
const {
  ROLE_LANDLORD,
  TASK_STATUS_NEW,
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_RESOLVED,
  TASK_STATUS_UNRESOLVED,
  URGENCY_LOW,
  URGENCY_HIGH,
  URGENCY_SUPER,
  URGENCY_NORMAL,
} = require('../../constants')
const TaskService = use('App/Services/TaskService')
const EstateService = use('App/Services/EstateService')
const HttpException = use('App/Exceptions/HttpException')

class TaskController {
  async createTask({ request, auth, response }) {
    try {
      response.res(await TaskService.create(request, auth.user))
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async init({ request, auth, response }) {
    //FIXME: called by tenant to create task. Must be validated
    //needs validator
    const data = request.all()

    try {
      response.res(await TaskService.init(auth.user, data))
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

  async getUnassignedTasks({ request, auth, response }) {
    try {
      const { page, limit } = request.all()
      response.res(
        await TaskService.getAllUnassignedTasks({
          user_id: auth.user.id,
          page,
          limit,
        })
      )
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async getAllTasks({ request, auth, response }) {
    try {
      const { estate_id, status, page, limit } = request.all()
      response.res(
        await TaskService.getAllTasks({
          user_id: auth.user.id,
          role: auth.user.role,
          estate_id: estate_id,
          status: status,
          page,
          limit,
        })
      )
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async getTaskById({ request, auth, response }) {
    const { id } = request.all()
    response.res(await TaskService.getTaskById({ id, user: auth.user }))
  }

  async getTaskCountsByEstate({ request, auth, response }) {
    const { id } = request.all()
    const new_task_count = (
      await TaskService.count({ estate_id: id, status: [TASK_STATUS_NEW] })
    )[0].count
    const progress_task_count = (
      await TaskService.count({ estate_id: id, status: [TASK_STATUS_INPROGRESS] })
    )[0].count
    const task_resolved_count = (
      await TaskService.count({ estate_id: id, status: [TASK_STATUS_RESOLVED] })
    )[0].count
    const task_unresolved_count = (
      await TaskService.count({ estate_id: id, status: [TASK_STATUS_UNRESOLVED] })
    )[0].count

    const low_urgency_count = (await TaskService.count({ estate_id: id, status: [URGENCY_LOW] }))[0]
      .count
    const normal_urgency_count = (
      await TaskService.count({ estate_id: id, status: [URGENCY_NORMAL] })
    )[0].count
    const high_urgency_count = (
      await TaskService.count({ estate_id: id, status: [URGENCY_HIGH] })
    )[0].count
    const super_urgency_count = (
      await TaskService.count({ estate_id: id, status: [URGENCY_SUPER] })
    )[0].count

    response.res({
      new_task_count,
      progress_task_count,
      task_resolved_count,
      task_unresolved_count,
      low_urgency_count,
      normal_urgency_count,
      high_urgency_count,
      super_urgency_count,
    })
  }

  async getEstateTasks({ request, auth, response }) {
    const params = request.post()
    delete params.global
    const { id } = request.all()
    let estate = await EstateService.getEstateWithTenant(id, auth.user.id)

    const estateAllTasks = await TaskService.getEstateAllTasks({
      user_id: auth.user.id,
      id,
      params,
    })

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

  async getQuickActionsCount({ request, auth, response }) {
    response.res(await EstateService.getQuickActionsCount(auth.user.id))
  }

  async getLandlordTasks({ request, auth, response }) {
    const params = request.post()
    try {
      const estates = await EstateService.getEstatesWithTask(
        auth.user,
        params,
        params?.filter_by_unread_message ? -1 : params.page || -1,
        params?.filter_by_unread_message ? -1 : params.limit || -1
      )

      const totalCountResult = await EstateService.getTotalLetCount(auth.user.id, params, false)

      let filterCountResultCount
      if (!params?.filter_by_unread_message) {
        filterCountResultCount = (await EstateService.getTotalLetCount(auth.user.id, params)).length
      } else {
        filterCountResultCount = estates.length
      }

      const result = {
        total: totalCountResult.length || 0,
        filtered: filterCountResultCount || 0,
        estates,
      }

      response.res(result)
    } catch (e) {
      throw new HttpException(e.message, e.status)
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

  // async onEditMessage({ request, auth, response }) {
  //   try {
  //     const { message, attachments, id } = request.all()

  //     await ChatService.editMessage({
  //       message,
  //       attachments,
  //       id,
  //     })
  //     response.res(true)
  //   } catch (err) {
  //     throw new HttpException(err.message)
  //   }
  // }
}

module.exports = TaskController
