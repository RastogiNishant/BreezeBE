'use strict'

const Plan = use('App/Models/Plan')
const HttpException = use('App/Exceptions/HttpException')
const { isArray } = require('lodash')
const { ROLE_ADMIN, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER } = require('../constants')

class PlanService {
  static async createPlan(data, trx) {
    return await Plan.createItem(
      {
        ...data,
      },
      trx
    )
  }
  static async updatePlan(data, trx) {
    let plan = await Plan.query().where({ id: data.id }).first()
    if (!plan) {
      throw new HttpException('Plan does not exist')
    }

    return await Plan.query()
      .where({ id: data.id })
      .update({
        ...data,
      })
      .transacting(trx)
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
    if (isArray(id)) {
      return (await Plan.query().with('planOption').whereIn('id', id).fetch()).rows
    } else {
      return await Plan.query().with('planOption').where('id', id).first()
    }
  }

  static async getProspectDefaultPlan() {
    return await Plan.query().where('prospect_free_plan', true).first()
  }

  static async getLandlordDefaultPlan() {
    return await Plan.query().where('landlord_free_plan', true).first()
  }

  static async getPlanAll(role) {
    if (role === ROLE_ADMIN) {
      return await Plan.query().orderBy('role', 'asc').orderBy('id', 'asc').fetch()
    } else {
      if (role === ROLE_PROPERTY_MANAGER) {
        role = ROLE_LANDLORD
      }
      return await Plan.query().where('role', role).orderBy('id', 'asc').fetch()
    }
  }
}

module.exports = PlanService
