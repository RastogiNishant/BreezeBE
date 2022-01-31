'use strict'

const HttpException = use('App/Exceptions/HttpException')

const PlanService = use('App/Services/PlanService')

class PlanController {
  async getPlan({ request, response }) {
    const {id} = request.all()
    const plan = await PlanService.getPlan(id)
    return response.res( plan );
  }

  async getPlanAll( {request, response }) {
    try{
      return response.res( await PlanService.getPlanAll())
    }catch(e){
      throw new HttpException(e.message, 400)
    }
  }

  async createPlan({ request, response }) {
    const {...data} = request.all()
    try{
      return response.res(await PlanService.createPlan(data))
    }catch(e) {
      throw new HttpException(e.message, 400)
    }
  }

  async updatePlan({ request, response }) {
    try{
      const {...data} = request.all()
      return response.res( await PlanService.updatePlan(data))
    }catch(e) {
      throw new HttpException( e.message, 400)
    }
  }

  async deletePlan({ request, response }) {
    try{
      const { ids } = request.all()
      return response.res( await PlanService.deletePlan(ids))
    }catch(e) {
      throw new HttpException( e.message, 400)
    }
  }
}

module.exports = PlanController