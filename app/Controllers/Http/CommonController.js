'use strict'

const constants = require('../../constants')

// const GeoAPI = use('GeoAPI')
// const User = use('App/Models/User')
const GeoService = use('App/Services/GeoService')

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
    const [all, street, buildNum, separator, zip] = query.match(
      /^([A-Za-zÀ-ž\u0370-\u03FF\u0400-\u04FF\-\s\(\)]*)\s*(\d*)(,?)\s?(\d*)/i
    )

    const result = await GeoService.getBuildQualityAutosuggest({ street, buildNum, separator, zip })
    response.res(result)
  }
}

module.exports = CommonController
