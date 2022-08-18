'use strict'
const Estate = use('App/Models/Estate')

class PropertyController {
  async getProperties({ request, response }) {
    return response.res(true)
  }
}

module.exports = PropertyController
