'use strict'

const HttpException = use('App/Exceptions/HttpException')

const AppService = use('App/Services/AppService')
const MatchService = use('App/Services/MatchService')
const EstateService = use('App/Services/EstateService')

class AppController {
  async createTenantLink({ request, auth, response }) {
    response.res(await AppService.createTenantDynamicLink())
  }
  async createLandlordLink({ request, auth, response }) {}

  async calculateMatchScore({ request, auth, response }) {
    const { estate_id, id } = request.all()
    const estate = await MatchService.getEstateForScoringQuery().where('id', estate_id).first()
    const prospect = await MatchService.getProspectForScoringQuery()
      .where('tenants.user_id', id)
      .first()
    const landlordScore = MatchService.calculateLandlordScore(prospect, estate, true)
    const prospectScore = await MatchService.calculateProspectScore(prospect, estate, true)
    const matchScore =
      (100 * ((landlordScore?.scoreLPer || 0) + (prospectScore?.scoreTPer || 0))) / 2
    return response.res({ estate, prospect, landlordScore, prospectScore, matchScore })
  }

  async calculateEstatePercent({ request, response }) {
    const { id } = request.all()
    const estate = await EstateService.getByIdWithDetail(id)
    if (!estate) {
      throw new HttpException('Estate not found!')
    }
    const percent = await EstateService.calculatePercent(estate.toJSON(), true)
    response.res({ estate, percent })
  }
}
module.exports = AppController
