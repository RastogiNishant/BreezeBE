'use strict'

const constants = require('../../constants')

// const GeoAPI = use('GeoAPI')
// const User = use('App/Models/User')
// const UserService = use('App/Services/UserService')

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
}

module.exports = CommonController
