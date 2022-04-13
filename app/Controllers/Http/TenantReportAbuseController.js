'use strict'

const TenantReportAbuseService = use('App/Services/TenantReportAbuseService')
const MatchService = use('App/Services/MatchService')
const HttpException = use('App/Exceptions/HttpException')

class TenantReportAbuseController {
  async reportTenantAbuse({ request, auth, response }) {
    const user = auth.user
    const { estate_id, tenant_id, abuse } = request.all()
    try {

      const matchResult = await MatchService.isExist(user.id, estate_id, tenant_id )
      if( ! matchResult ) {
        throw new HttpException('No permission to report abuse')
      }
      
      const params = {
        lanlord_id: user.id,
        estate_id: estate_id,
        tenant_id: tenant_id,
        abuse: abuse
      }

      const result = await TenantReportAbuseService.reportTenantAbuse(params)
      return response.res(result)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  /**
   * Only Administrator can delete this abuse
   * @param {*} param0
   */
  async deleteAbuse({ request, auth, response }) {
    const user = auth.user
    const { tenant_id } = request.all()
  }
}

module.exports = TenantReportAbuseController
