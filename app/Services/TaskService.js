'use strict'

const Task = use('App/Models/Task')

class TaskService {
  static async create(task, trx) {
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
}

module.exports = TaskService
