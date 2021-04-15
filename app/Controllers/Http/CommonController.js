'use strict'

const constants = require('../../constants')

// const GeoAPI = use('GeoAPI')
// const User = use('App/Models/User')
const GeoService = use('App/Services/GeoService')
const EstateService = use('App/Services/EstateService')
const HttpException = use('App/Exceptions/HttpException')

class CommonController {
  /**
   * Just for test some api
   */
  async ping() {
    // const [lat, long] = [52.509269, 13.3141764]
    // const result = await GeoAPI.getBatchedPlaces({ lat, long })
    //
    // console.log({ result })

    return 'pong'
  }

  /**
   *
   */
  async getReferences({ response }) {
    response.res({ constants })
  }

  /**
   * Get available street
   */
  async searchStreet({ request, response }) {
    const { query } = request.all()
    const result = await GeoService.getBuildQualityAutosuggest(query)
    response.res(result)
  }

  /**
   *
   */
  async calcRentPrice({ request, response }) {
    const { year, sqr, address } = request.all()
    let range
    try {
      const quality = await GeoService.getQualityByAddress({ year, sqr, address })
      range = await EstateService.getSqrRange({ year, sqr, quality })
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
    if (!range.length) {
      throw new HttpException('Not found', 404)
    }
    const { min_rate, max_rate } = range[0]
    console.log(range)

    response.res({ min_rate, max_rate, min_price: sqr * min_rate, max_price: max_rate * sqr })
  }
}

module.exports = CommonController
