'use strict'

const HttpException = use('App/Exceptions/HttpException')

const PlanService = use('App/Services/PlanService')
const UserService = use('App/Services/UserService')
const Database = use('Database')
const Plan = use('App/Models/Plan')

const { MONTHLY_PAYMENT, YEARLY_PAYMENT, ROLE_USER, ROLE_LANDLORD } = require('../../constants')

class PlanController {
  async getPlan({ request, response }) {
    const { id } = request.all()
    const plan = await PlanService.getPlan(id)
    let planJson = plan.toJSON()
    if (!planJson.planOption || planJson.planOption) {
      const monthlyOption = planJson.planOption.find((po) => po.plan_option == MONTHLY_PAYMENT)
      if (monthlyOption) {
        planJson = {
          priceDescription: `${monthlyOption.price}€ / month`,
          ...planJson,
        }
      } else {
        planJson = {
          priceDescription: 'Free',
          ...planJson,
        }
      }
    } else {
      planJson = {
        priceDescription: 'Free',
        ...planJson,
      }
    }

    return response.res(planJson)
  }

  async getPlanAll({ request, auth, response }) {
    try {
      return response.res(await PlanService.getPlanAll(auth.user.role))
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async updateFreePlan(data, trx = null) {
    //prospect
    let old_free_plan
    if (data.prospect_free_plan && data.role === ROLE_USER) {
      if (data.status === false) {
        throw new HttpException("Default plan can't be disabled")
      }

      old_free_plan = await PlanService.getProspectDefaultPlan()

      if (old_free_plan) {
        await PlanService.updatePlan(
          {
            ...old_free_plan.toJSON(),
            prospect_free_plan: false,
          },
          trx
        )
      }
    }

    //landlord
    if (data.landlord_free_plan && data.role === ROLE_LANDLORD) {
      if (data.status === false) {
        throw new HttpException("Default plan can't be disabled")
      }

      old_free_plan = await PlanService.getLandlordDefaultPlan()

      if (old_free_plan) {
        await PlanService.updatePlan(
          {
            ...old_free_plan.toJSON(),
            landlord_free_plan: false,
          },
          trx
        )
      }
    }
    return old_free_plan
  }

  async createPlan({ request, response }) {
    const { ...data } = request.all()

    const trx = await Database.beginTransaction()

    try {
      const old_free_plan = await this.updateFreePlan(data, trx)
      const plan = await PlanService.createPlan(data, trx)
      if (old_free_plan && plan) {
        await UserService.updateFreeUserPlans(old_free_plan.id, plan.id, trx)
      }
      await trx.commit()
      return response.res(plan)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  async updatePlan({ request, response }) {
    const trx = await Database.beginTransaction()
    try {
      const { ...data } = request.all()
      const old_free_plan = await this.updateFreePlan(data, trx)
      const ret = await PlanService.updatePlan(data, trx)

      if (old_free_plan) {
        await UserService.updateFreeUserPlans(old_free_plan.id, data.id, trx)
      }

      await trx.commit()
      return response.res(ret)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  async deletePlan({ request, response }) {
    try {
      const { ids } = request.all()
      const plans = await PlanService.getPlan(ids)

      const free_plans = plans.filter((plan) => plan.prospect_free_plan || plan.landlord_free_plan)

      if (free_plans && free_plans.length) {
        throw new HttpException("Free plans can'be deleted", 400)
      }

      const users = await UserService.getUserByPaymentPlan(ids)
      if (users && users.length) {
        throw new HttpException("Some users are in this plan, can't be deleted", 400)
      }
      return response.res(await PlanService.deletePlan(ids))
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = PlanController
