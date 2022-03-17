const HttpException = use('App/Exceptions/HttpException')
const Logger = use('Logger')
const TenantPaymentPlan = use('App/Models/TenantPaymentPlan')

class TenantPaymentPlanService {
  static async createTenantPaymentPlan(data){
    try{
      return await TenantPaymentPlan.createItem({
        ...data
      })
    }catch(e) {
      throw new HttpException(e.message, 400)
    }
  }
  static async updateTenantPaymentPlan(id, data ) {
    try{
      await TenantPaymentPlan.query()
        .where('id', id)
        .update({
          ...data
        })
    }catch(e) {
      throw new HttpException(e.message, 400)
    }
  }
  static async deleteTenantPaymentPlan(id) {
    try{
      await TenantPaymentPlan.query()
      .where('id', id)
      .delete()
      return true  
    }catch(e) {
      throw new HttpException(e.message, 400)
    }
  }
  static async getTenantPaymentPlan({plan_id, plan_option}) {

    let tenantPaymentPlanQuery = TenantPaymentPlan.query()
    if(plan_id) {
      tenantPaymentPlanQuery = tenantPaymentPlanQuery.where('plan_id', plan_id)
    }
    if(plan_option) {
      tenantPaymentPlanQuery = tenantPaymentPlanQuery.where('plan_option', plan_option)      
    }
    return (await tenantPaymentPlanQuery.fetch()).rows        
  }
  static async getTenantPaymentPlanById(id) {
    return await TenantPaymentPlan.query()
      .where('id', id)
      .firstOrFail()
  }
}

module.exports = TenantPaymentPlanService