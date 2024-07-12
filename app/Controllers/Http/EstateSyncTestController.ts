'use strict'

import {
  USER_STATUS,
  PUBLISH_STATUS
} from '../../constants'

const HttpException = use('App/Exceptions/HttpException')
const EstateSync = use('App/Classes/EstateSync')

// const EstateSyncService = use('App/Services/EstateSyncService')
const EstateService = use('App/Services/EstateService')

export class EstateSyncTestController {
  /**
   * Testing output use in estate sync requests
   */
  async generateEstateData ({ request, response }): Promise<void> {
    const { estateId } = request.all()

    let estate = await EstateService.getByIdWithDetail(estateId)
    estate = estate?.toJSON()
    if (estate?.status !== USER_STATUS.ACTIVE || estate?.publish_status !== PUBLISH_STATUS.APPROVED_BY_ADMIN) {
      throw new HttpException('Estate not found or not published.', 404)
    }

    const estateSync = new EstateSync(process.env.ESTATE_SYNC_API_KEY)
    const resp = await estateSync.generateEstateData({
      estate
    })

    response.res(resp)
  }
}

// node compatible
module.exports = EstateSyncTestController
