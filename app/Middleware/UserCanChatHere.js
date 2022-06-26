'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const { ROLE_LANDLORD } = require('../constants')
const CurrentTenant = use('App/Models/EstateCurrentTenant')
const Task = use('App/Models/Task')
const HttpException = use('App/Exceptions/HttpException')

class UserCanChatHere {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async wsHandle({ socket, auth, request }, next) {
    // call next to advance the request
    request.user_id = auth.user.id
    let matches
    let currentTenant
    if ((matches = socket.topic.match(/^estate:([0-9]+)$/))) {
      //estate chat...
      //make sure that the user is the current tenant or the owner of this estate
      currentTenant = await this._getCurrentTenant(matches[1], auth.user.id, auth.user.role)
      if (!currentTenant) {
        throw new HttpException(`User cannot send message to this topic.`)
      }
      request.estate_id = matches[1]
    } else if ((matches = socket.topic.match(/^task:([0-9]+)brz([0-9]+)$/))) {
      //brz - is the divider between estate and task id
      //estate task chat
      currentTenant = await this._getCurrentTenant(matches[1], auth.user.id, auth.user.role)
      if (!currentTenant) {
        throw new HttpException(`User cannot send message to this topic.`)
      }
      const task = this._getTask(matches[2], matches[1])
      if (!task) {
        throw new HttpException(`Task not found or you are not allowed on this task`)
      }
      request.task_id = task.id
    }
    await next()
  }

  async _getCurrentTenant(estate_id, user_id, role = ROLE_LANDLORD) {
    let currentTenant
    let query = CurrentTenant.query()
      .where('estate_id', estate_id)
      .leftJoin('estates', 'estate_current_tenants.estate_id', 'estates.id')
      .orderBy('estate_current_tenants.id', 'desc')
    if (role === ROLE_LANDLORD) {
      currentTenant = await query.where('estates.user_id', user_id).first()
    } else {
      currentTenant = await query.where('estate_current_tenants.user_id', user_id).first()
    }
    return currentTenant
  }

  async _getTask(task_id, estate_id) {
    let task = await Task.query().where('id', task_id).where('estate_id', estate_id).first()
    return task
  }
}

module.exports = UserCanChatHere
