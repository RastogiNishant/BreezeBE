'use strict'
const { ROLE_LANDLORD, ROLE_USER } = require('../constants')
const { files } = require('../../config/bodyParser')
const { TASK_STATUS_NEW } = require('../constants')
const { isArray } = require('lodash')

const Task = use('App/Models/Task')
const File = use('App/Classes/File')
const MatchService = use('App/Services/MatchService')
const EstateService = use('App/Services/EstateService')

class TaskService {
  static async create(request, trx) {
    const { ...data } = request.all()

    const files = await this.saveTaskImages(request)
    let task = {
      ...data,
      status: TASK_STATUS_NEW,
    }
    if (files && files.file) {
      const path = JSON.stringify(!isArray(files.file) ? [files.file] : files.file)
      console.log('Path', path)
      const pathJSON = path.map((p) => {
        path: p
      })
      task = {
        ...task,
        attachments: pathJSON,
      }
    }
    return await Task.createItem({ ...task }, trx)
  }

  static async update(id, task, trx) {
    const query = Task.query().where('id', id)

    if (trx) return await query.update({ ...task }).transacting(trx)
    return await query.update({ ...task })
  }

  static async delete(id, trx) {
    const query = Task.query().where('id', id)
    if (trx) await query.delete().transacting(trx)
    return query.delete()
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
    if (role === ROLE_LANDLORD) {
      //to check if the user has permission
      await EstateService.hasPermission({ id: estate_id, user_id })
      if (!(await MatchService.getFinalMatch(estate_id))) {
        throw new HttpException('No tenant yet', 500)
      }
    }

    // to check if the user is not the tenant for that property.
    if (role === ROLE_USER) {
      await MatchService.findCurrentTenant(estate_id, user_id)
    }
    return true
  }
}

module.exports = TaskService
