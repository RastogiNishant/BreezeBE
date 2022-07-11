'use strict'
const { ROLE_LANDLORD, ROLE_USER } = require('../constants')

const { isArray } = require('lodash')
const {
  TASK_STATUS_NEW,
  TASK_STATUS_DRFAT,
  TASK_STATUS_DELETE,
  ESTATE_FIELD_FOR_TASK,
} = require('../constants')
const HttpException = require('../Exceptions/HttpException')
const Drive = use('Drive')
const Task = use('App/Models/Task')
const File = use('App/Classes/File')
const MatchService = use('App/Services/MatchService')
const EstateService = use('App/Services/EstateService')
const Database = use('Database')
const TaskFilters = require('../Classes/TaskFilters')

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

  static async delete({ id, user }, trx) {
    const task = await this.get(id)
    if (
      await this.hasPermission({
        estate_id: task.estate_id,
        user_id: user.id,
        role: user.role,
      })
    ) {
      const query = Task.query().where('id', id)

      if (trx) await query.update({ status: TASK_STATUS_DELETE }).transacting(trx)
      return await query.update({ status: TASK_STATUS_DELETE })
    }
  }

  static async getTaskById({ id, user }) {
    let task = await Task.query()
      .where('id', id)
      .with('user', function (u) {
        u.select('id', 'avatar')
      })
      .with('estate', function (e) {
        e.select(ESTATE_FIELD_FOR_TASK)
      })
      .first()
    if (!task) {
      return null
    }

    if (user.role === ROLE_LANDLORD) {
      await EstateService.hasPermission({ id: task.estate_id, user_id: user.id })
    }
    if (user.role === ROLE_USER && task.tenant_id !== user.id) {
      throw new HttpException('No Permission')
    }

    task = await TaskService.getItemWithAbsoluteUrl(task)
    return task
  }

  static async getTenantAllTask({ tenant_id, estate_id, status }) {
    let taskQuery = Task.query().where('tenant_id', tenant_id)

    if (status) {
      taskQuery.whereIn('status', status)
    }
    taskQuery
      .with('estate', function (e) {
        e.select(ESTATE_FIELD_FOR_TASK)
      })
      .where('estate_id', estate_id)
      .whereNot('status', TASK_STATUS_DELETE)
      .orderBy('status', 'asc')
      .orderBy('created_at', 'asc')
      .orderBy('urgency', 'desc')

    let tasks = (await taskQuery.fetch()).rows
    tasks = await Promise.all(
      tasks.map(async (t) => {
        return await TaskService.getItemWithAbsoluteUrl(t)
      })
    )
    return tasks
  }

  static async count({ estate_id, status, urgency, role }) {
    let query = Database.table('tasks').count('*').where('estate_id', estate_id)

    if (status) {
      if (!isArray(status)) {
        status = [status]
      }

      query.whereIn('status', status)
    }

    if (urgency) {
      if (!isArray(urgency)) {
        urgency = [urgency]
      }
      query.whereIn('status', status)
    }

    if (role === ROLE_LANDLORD) {
      query.whereNot('status', TASK_STATUS_DRFAT)
    }
    return await query
  }

  static async getEstateAllTasks(user, id, params, page, limit = -1) {
    let query = Task.query()
      .select('tasks.*')
      .where('estate_id', id)
      .whereNot('tasks.status', TASK_STATUS_DRFAT)
      .innerJoin({ _e: 'estates' }, function () {
        this.on('tasks.estate_id', '_e.id').on('_e.user_id', user.id)
      })

    const filter = new TaskFilters(params, query)
    query = filter.process()

    query.orderBy('tasks.updated_at')

    if (limit == -1) {
      return await query.fetch()
    } else {
      return await query.paginate(page, limit)
    }
  }

  static async get(id) {
    return await Task.query().where('id', id).firstOrFail()
  }

  static async getWithTenantId({ id, tenant_id }) {
    return await Task.query().where('id', id).where('tenant_id', tenant_id).firstOrFail()
  }

  static async getWithDependencies(id) {
    return await Task.query().where('id', id).with('estate').with('users')
  }

  static async saveTaskImages(request) {
    const imageMimes = [File.IMAGE_JPG, File.IMAGE_JPEG, File.IMAGE_PNG]
    const files = await File.saveRequestFiles(request, [
      { field: 'file', mime: imageMimes, isPublic: false },
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
      .attachments.filter(
        (attachment) => !(attachment.user_id === user.id && attachment.uri === uri)
      )

    return await Task.query()
      .where('id', id)
      .update({
        ...task.toJSON(),
        attachments: attachments && attachments.length ? JSON.stringify(attachments) : null,
      })
  }

  static async getItemWithAbsoluteUrl(item) {
    try {
      if (item.attachments) {
        item.attachments = await Promise.all(
          item.attachments.map(async (attachment) => {
            const thumb =
              attachment.uri.split('/').length === 2
                ? await File.getProtectedUrl(
                    `thumbnail/${attachment.uri.split('/')[0]}/thumb_${
                      attachment.uri.split('/')[1]
                    }`
                  )
                : ''

            if (attachment.uri.search('http') !== 0) {
              return {
                user_id: attachment.user_id,
                url: await File.getProtectedUrl(attachment.uri),
                uri: attachment.uri,
                thumb: thumb,
              }
            }

            return {
              user_id: attachment.user_id,
              url: attachment.uri,
              uri: attachment.uri,
              thumb: thumb,
            }
          })
        )
      }
      return item
    } catch (e) {
      console.log(e.message, 500)
      return null
    }
  }
}

module.exports = TaskService
