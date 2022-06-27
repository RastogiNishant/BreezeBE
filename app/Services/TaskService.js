'use strict'
const { ROLE_LANDLORD, ROLE_USER } = require('../constants')
const { files } = require('../../config/bodyParser')
const { TASK_STATUS_NEW } = require('../constants')
const { isArray } = require('lodash')
const HttpException = require('../Exceptions/HttpException')

const Task = use('App/Models/Task')
const File = use('App/Classes/File')
const MatchService = use('App/Services/MatchService')
const EstateService = use('App/Services/EstateService')

class TaskService {
  static async create(request, user, trx) {
    const { ...data } = request.all()
    const tenant_id = await this.hasPermission({
      estate_id: data.estate_id,
      user_id: user.id,
      role: user.role,
    })

    let task = {
      ...data,
      creator_role: user.role,
      tenant_id: tenant_id,
      status: TASK_STATUS_NEW,
    }

    const files = await TaskService.saveTaskImages(request)
    if (files && files.file) {
      const path = !isArray(files.file) ? [files.file] : files.file
      const attachments = path.map((p) => {
        return { user_id: user.id, uri: p }
      })

      task = {
        ...task,
        attachments: JSON.stringify(attachments),
      }
    }

    return await Task.createItem(task, trx)
  }

  static async update({ user, task }, trx) {
    if (user.role === ROLE_LANDLORD) {
      await EstateService.hasPermission({ id: estate_id, user_id: user.id })
    }

    const query = Task.query().where('id', task.id).where('estate_id', task.estate_id)

    if (user.role === ROLE_USER) {
      query.where('tenant_id', user.id)
    }

    if (trx) return await query.update({ ...task }).transacting(trx)
    return await query.update({ ...task })
  }

  static async delete({ id, estate_id, user }, trx) {
    const task = await this.get(id)
    if (
      await this.hasPermission({
        estate_id: task.estate_id,
        user_id: user.id,
        role: user.role,
      })
    ) {
      const query = Task.query().where('id', id)

      if (trx) await query.delete().transacting(trx)
      return await query.delete()
    }
  }

  static async getAll(filter) {
    let query = Task.query()
    if (filter.estate_id) {
      query.where('estate_id', filter.estate_id)
    }
    if (filter.status) {
      query.where('status', filter.status)
    }
    return await query.with('estate').with('users').fetch().rows
  }

  static async get(id) {
    return await Task.query().where('id', id).firstOrFail()
  }

  static async getWith(id) {
    return await Task.query().where('id', id).with('estate').with('users')
  }

  static async saveTaskImages(request) {
    const imageMimes = [File.IMAGE_JPG, File.IMAGE_JPEG, File.IMAGE_PNG]
    const files = await File.saveRequestFiles(request, [
      { field: 'file', mime: imageMimes, isPublic: true },
    ])

    return files
  }

  static async hasPermission({ estate_id, user_id, role }) {
    //to check if the user has permission
    if (role === ROLE_LANDLORD) {
      await EstateService.hasPermission({ id: estate_id, user_id })
    }
    const finalMatch = await MatchService.getFinalMatch(estate_id)
    if (!finalMatch) {
      throw new HttpException('No final match yet for property', 500)
    }
    // to check if the user is the tenant for that property.
    if (role === ROLE_USER && finalMatch.user_id !== user_id) {
      throw new HttpException('No permission for task', 500)
    }

    if (!finalMatch.user_id) {
      throw new HttpException('Database issue', 500)
    }

    return finalMatch.user_id
  }

  static async addImages(request, user) {
    const { id } = request.all()
    let task = await this.get(id)
    await this.hasPermission({ estate_id: task.estate_id, user_id: user.id, role: user.role })
    const files = await TaskService.saveTaskImages(request)
    if (files && files.file) {
      const path = !isArray(files.file) ? [files.file] : files.file
      const pathJSON = path.map((p) => {
        return { user_id: user.id, uri: p }
      })
      task = {
        ...task.toJSON(),
        attachments: JSON.stringify((task.toJSON().attachments || []).concat(pathJSON)),
      }
      return await Task.query()
        .where('id', id)
        .update({ ...task })
    }
    throw new HttpException('Image Not saved', 500)
  }

  static async removeImages({ id, user, uri }) {
    const task = await this.get(id)
    await this.hasPermission({ estate_id: task.estate_id, user_id: user.id, role: user.role })
    const attachments = task
      .toJSON()
      .attachments.filter((attachment) => !(attachment.user_id === user.id && attachment.uri === uri))
    console.log('TASK', attachments)
    console.log('TASK LENG', attachments.length)
    return await Task.query()
      .where('id', id)
      .update({
        ...task.toJSON(),
        attachments: attachments && attachments.length ? JSON.stringify(attachments) : null,
      })
  }
}

module.exports = TaskService