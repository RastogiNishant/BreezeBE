'use strict'

const Plan = use('App/Models/Plan')
const HttpException = use('App/Exceptions/HttpException')

class PlanService {
  static async createPlan(data) {
    return Plan.createItem({
      ...data,
    })
  }
  static async updatePlan(data) {
    const oldPlan = await Plan.query().where({ id: data.id }).first()

    if (!oldPlan) {
      throw new HttpException('Plan does not exist')
    }

    return await Plan.query()
      .where({ id: data.id })
      .update({
        ...data,
      })
  }

  static async deletePlan(ids) {
    try {
      await Plan.query().whereIn('id', ids).delete()
      return true
    } catch (e) {
      return e
    }
  }

  static async getPlan(id) {
    return await Plan.query()
      .with('planOption')
      .where('id', id).first()
  }

  static async getPlanAll() {
    return await Plan.query().orderBy('id', 'asc').fetch()
  }
}

module.exports = PlanService
