'use strict'

const EstateReportAbuseService = use('App/Services/EstateReportAbuseService')
const HttpException = use('App/Exceptions/HttpException')

class EstateAbuseController {
  async reportEstateAbuse({ request, auth, response }) {
    const user = auth.user
    const { abuse, estate_id } = request.all()
    try{
      const result = await EstateReportAbuseService.reportEstateAbuse(user.id, estate_id, abuse)
      return response.res(result)
    }catch(e) {
      throw new HttpException(e.message, 400)
    }
  }

  /**
   * Only Administrator can delete this abuse
   * @param {*} param0 
   */
  async deleteAbuse({ request, auth, response }) {
    const user = auth.user
    const { estate_id } = request.all()
  }
}

module.exports = EstateAbuseController