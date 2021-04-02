'use strict'

const constants = require('../../constants')

const User = use('App/Models/User')
const UserService = use('App/Services/UserService')

class CommonController {
  /**
   * Just for test some api
   */
  async ping() {
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
