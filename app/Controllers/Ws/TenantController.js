'use strict'
const BaseController = require('./BaseController')

class TenantController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
    this.taskId = request.userId
  }
}

module.exports = TenantController
