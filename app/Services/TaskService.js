'use strict'

const { files } = require('../../config/bodyParser')
const { TASK_STATUS_NEW } = require('../constants')
const { isArray } = require('lodash')

const Task = use('App/Models/Task')
const File = use('App/Classes/File')

class TaskService {
  static async create(request, trx) {
const { ...data } = request.all()
console.log('Data', data)
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
}

module.exports = TaskService
