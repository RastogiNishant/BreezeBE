'use strict'

const PredefinedMessageAnswer = use('App/Models/PredefinedMessageAnswer')
const TaskService = use('App/Services/TaskService')
class PredefinedAnswerService {
  static async create(user_id, data, trx) {
    await TaskService.getWithTenantId({ id: data.task_id, tenant_id: user_id })
    console.log('Creating predefined Answer', data)
    return await PredefinedMessageAnswer.createItem({ ...data }, trx)
  }

  static async update(user_id, data, trx) {
    await TaskService.getWithTenantId({ id: data.task_id, tenant_id: user_id })

    if (trx) {
      return await PredefinedMessageAnswer.query()
        .where('id', data.id)
        .update(data)
        .transacting(trx)
    } else {
      return await PredefinedMessageAnswer.query().where('id', data.id).update(data)
    }
  }

  static async get(id) {
    return await PredefinedMessageAnswer.query().where('id', id).firstOrFail()
  }

  static async getByTask(task_id) {
    return (await PredefinedMessageAnswer.query().where('task_id', task_id).fetch()).rows
  }

  static async delete(id, user_id, trx) {
    const answer = await this.get(id)
    await TaskService.getWithTenantId({ id: answer.task_id, tenant_id: user_id })
    if (trx) {
      return await PredefinedMessageAnswer.query().where('id', id).delete().transacting(trx)
    }
    return await PredefinedMessageAnswer.query().where('id', id).delete()
  }
}

module.exports = PredefinedAnswerService
