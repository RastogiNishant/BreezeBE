'use strict'

const HttpException = use('App/Exceptions/HttpException')

const TenantPaymentPlanService = use('App/Services/TenantPaymentPlanService')

class TenantPaymentPlanController {

  async getTenantPaymentPlanById({request, auth, response}) {
    const {id} = request.all()
    try{
      const tenantPaymentPlan = await TenantPaymentPlanService.getTenantPaymentPlanById(id)
      response.res(tenantPaymentPlan)
    }catch(e) {
      throw new HttpException(e.message, 400)
    }
    
  }  
  async getTenantPaymentPlan({request, auth, response}) {
    const {plan_id} = request.all()
    await TenantPaymentPlanService.getTenantPaymentPlan(plan_id)
  }
  async createTenantPaymentPlan({request, auth, response}) {
    const{ plan_id, plan_option, ...data} = request.all()

    const paymentPlan = await TenantPaymentPlanService.getTenantPaymentPlan({plan_id, plan_option })
    if(paymentPlan && paymentPlan.length){
      throw new HttpException('Payment Plan already exists', 400 )
    }
    await TenantPaymentPlanService.createTenantPaymentPlan({
      plan_id,
      plan_option,
      ...data
    })
    response.res(data)
  }

  async updateTenantPaymentPlan({request, auth, response}) {
    const {id, ...data} = request.all()
    await TenantPaymentPlanService.updateTenantPaymentPlan(id, data)
    response.res(true)
  }

  async deleteTenantPaymentPlan({request, auth, response}) {
    const {id} = request.all()
    await TenantPaymentPlanService.deleteTenantPaymentPlan(id)
    response.res(true)
  }
}

module.exports = TenantPaymentPlanController