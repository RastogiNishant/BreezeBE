'use strict'
const { WEBSOCKET_TENANT_REDIS_KEY } = require('../../constants')
const BaseController = require('./BaseController')

const Redis = use('Redis')
class TenantController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
    this.subscribe(WEBSOCKET_TENANT_REDIS_KEY)
    this.unsubscribe(WEBSOCKET_TENANT_REDIS_KEY)
  }
}

module.exports = TenantController
