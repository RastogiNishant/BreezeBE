'use strict'

const constants = require('../../constants')

class CommonController {
  /**
   *
   */
  async getReferences({ response }) {
    response.res({ constants })
  }
}

module.exports = CommonController
