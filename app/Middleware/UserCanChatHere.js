'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const { ROLE_LANDLORD } = require('../constants')
const CurrentTenant = use('App/Models/EstateCurrentTenant')
const Task = use('App/Models/Task')
const HttpException = use('App/Exceptions/HttpException')
const Database = use('Database')
const MatchService = use('App/Services/MatchService')

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
    let chatUser
    if ((matches = socket.topic.match(/^estate:([0-9]+)$/))) {
      //estate chat...
      //make sure that the user is the current tenant or the owner of this estate
      chatUser = await this._hasPermissionToChat(matches[1], auth.user.id, auth.user.role)
      if (!chatUser) {
        throw new HttpException(`User cannot send message to this topic.`, 403, 1101)
      }
      request.estate_id = matches[1]
    } else if ((matches = socket.topic.match(/^task:([0-9]+)brz([0-9]+)$/))) {
      //brz - is the divider between estate and task id
      //estate task chat
      chatUser = await this._hasPermissionToChat(matches[1], auth.user.id, auth.user.role)
      if (!chatUser) {
        throw new HttpException(`User cannot send message to this topic.`, 403, 1102)
      }
      const task = await this._getTask(matches[2], matches[1])
      if (!task) {
        throw new HttpException(`Task not found or you are not allowed on this task`, 403, 1103)
      }
      request.task_id = task.id
      request.estate_id = matches[1]
      request.tenant_user_id = chatUser.tenant_user_id
      request.estate_user_id = chatUser.estate_user_id
    } else {
      throw new HttpException(`Task topic not valid.`, 403, 1104)
    }
    await next()
  }

  async _hasPermissionToChat(estate_id, user_id, role = ROLE_LANDLORD) {
    let chatUser

    // check if this estate has a final match
    let query = CurrentTenant.query()
      .select(Database.raw(`estate_current_tenants.user_id as tenant_user_id`))
      .select(Database.raw(`estates.user_id as estate_user_id`))
      .where('estate_id', estate_id)
      .orderBy('estate_current_tenants.id', 'desc')
      .leftJoin('estates', 'estate_current_tenants.estate_id', 'estates.id')
    if (role === ROLE_LANDLORD) {
      chatUser = await query.where('estates.user_id', user_id).first()
    } else {
      chatUser = await query.where('estate_current_tenants.user_id ', user_id).first()
    }

    // check if this estate has a top match
    if (!chatUser) {
      chatUser = await MatchService.getUserToChat({ user_id, estate_id, role })
    }

    return chatUser
  }

  async _getTask(task_id, estate_id) {
    let task = await Task.query().where('id', task_id).where('estate_id', estate_id).first()
    return task
  }
}

module.exports = UserCanChatHere
