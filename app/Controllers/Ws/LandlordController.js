'use strict'
const BaseController = require('./BaseController')

class LandlordController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
  }
}

module.exports = LandlordController
