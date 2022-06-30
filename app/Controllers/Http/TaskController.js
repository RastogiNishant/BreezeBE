'use strict'
const { isEmpty, isFunction, isNumber, pick, trim, maxBy, countBy } = require('lodash')
const {
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_NEW,
  TASK_STATUS_CLOSED,
  TASK_STATUS_RESOLVED,
  TASK_STATUS_UNRESOLVED,
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
  async getLandlordTasks({ request, auth, response }) {
    const params = request.post()
    const page = params.page
    const limit = params.limit

    try {
      const totalCount = await EstateService.getTotalLetCount(auth.user.id)

      let estates = await TaskService.getLanlordAllTasks(auth.user, params, page, limit || -1)
      console.log('Estates total count', totalCount)
      // const data = estates.toJSON().data.map(estate => {
      //   const active_tasks = estate.tasks.filter( task => task.status === TASK_STATUS_INPROGRESS || task.status === TASK_STATUS_NEW )
      //   const urgentStatus = maxBy(active_tasks, function(task){
      //     return task.urgency
      //   })

      //   let urgentCount = 0

      //   if( urgentStatus ){
      //     urgentCount = countBy(active_tasks, function(task){
      //       return task.urgency === urgentStatus.urgency
      //     })
      //   }

      //   // if( !params.estate_id ) {
      //   //   delete estate.tasks
      //   // }

      //   return {
      //     ...estate,
      //     taskSummary: {
      //       activeCount: active_tasks.length || 0,
      //       urgentCount: urgentCount.true || 0,
      //       status: urgentStatus.urgency
      //     }
      //   }
      // })

      estates = {
        ...estates.toJSON(),
        //data: data,
      }

      // if( params.estate_id ){
      //   const archieveTasksCount = await TaskService.count({estate_id:params.estate_id, status:[TASK_STATUS_CLOSED, TASK_STATUS_RESOLVED, TASK_STATUS_UNRESOLVED], role:auth.user.role})
      //   estates.data[0].taskSummary.archivedTasksCount = archieveTasksCount[0].count
      // }

      response.res(estates)
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
