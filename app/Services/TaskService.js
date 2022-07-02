'use strict'
const {
  ROLE_LANDLORD,
  ROLE_USER,
  MATCH_STATUS_FINISH,
  STATUS_ACTIVE,
  TASK_STATUS_INPROGRESS,
  STATUS_EXPIRE,
  STATUS_DELETE,
} = require('../constants')

const { groupBy, countBy, isArray, maxBy } = require('lodash')
const { TASK_STATUS_NEW, LETTING_TYPE_LET, TASK_STATUS_DRFAT } = require('../constants')
const HttpException = require('../Exceptions/HttpException')

const Task = use('App/Models/Task')
const Estate = use('App/Models/Estate')
const File = use('App/Classes/File')
const MatchService = use('App/Services/MatchService')
const EstateService = use('App/Services/EstateService')
const TaskFilters = require('../Classes/TaskFilters')
const Database = use('Database')

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

      if (trx) await query.delete().transacting(trx)
      return await query.delete()
    }
  }

  static async getTenantAllTask({ tenant_id }) {
    return (
      await Task.query()
        .where('tenant_id', tenant_id)
        .orderBy('status', 'asc')
        .orderBy('created_at', 'asc')
        .orderBy('urgency', 'desc')
        .fetch()
    ).rows
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

  static async getLanlordAllTasks(user, params, page, limit = -1) {
    let query = Estate.query()
      .with('inside_current_tenant', function (ict) {
        ict.select(Database.raw('id, firstname, secondname'))
      })
      .with('outside_current_tenant')
      .select(
        'estates.id',
        'estates.address',
        'estates.property_id',
        'estates.city',
        'tasks.id as tid',
        'tasks.urgency as urgency',
        Database.raw('COALESCE( bool(_m.status), false ) as is_breeze_tenant')
      )

    query.leftJoin({ _m: 'matches' }, function () {
      this.on('_m.estate_id', 'estates.id').on('_m.status', MATCH_STATUS_FINISH)
    })

    query.leftJoin('tasks', function () {
      this.on('estates.id', 'tasks.estate_id').on(
        Database.raw(`tasks.status != ${TASK_STATUS_DRFAT}`)
      )
    })

    query.where('estates.user_id', user.id)
    query.whereNot('estates.status', STATUS_DELETE)
    query.andWhere(function () {
      this.orWhere('estates.letting_type', LETTING_TYPE_LET)
      this.orWhere(
        'estates.id',
        'IN',
        Database.raw(`
        SELECT estate_id from matches where status  = ${MATCH_STATUS_FINISH}
      `)
      )
    })

    if (params.estate_id) {
      query.whereIn('estates.id', [params.estate_id])
    }

    const filter = new TaskFilters(params, query)
    query = filter.process()
    query.groupBy('estates.id', '_m.status', 'tasks.id')
    query.orderBy('_m.status')

    let result = null
    if (limit == -1) {
      result = await query.fetch()
    } else {
      result = await query.paginate(page, limit)
    }

    result = Object.values(groupBy(result.toJSON().data || result.toJSON(), 'id'))

    const estate = result.map((r) => {
      const mostUrgency = maxBy(r, (re) => {
        return re.urgency
      })

      return {
        ...r[0],
        task: {
          taskCount: countBy(r, (re) => re.tid !== null).true || 0,
          mostUrgency: mostUrgency?.urgency || null,
          mostUrgencyCount: mostUrgency
            ? countBy(r, (re) => re.urgency === mostUrgency.urgency).true || 0
            : 0,
        },
      }
    })
    return estate
  }

  static async get(id) {
    return await Task.query().where('id', id).firstOrFail()
  }

  static async getWithTenantId({ id, tenant_id }) {
    return await Task.query().where('id', id).where('tenant_id', tenant_id).firstOrFail()
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
      .attachments.filter(
        (attachment) => !(attachment.user_id === user.id && attachment.uri === uri)
      )
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
