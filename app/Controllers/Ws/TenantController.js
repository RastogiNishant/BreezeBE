'use strict'
const { WEBSOCKET_TENANT_REDIS_KEY } = require('../../constants')
const BaseController = require('./BaseController')
const Logger = use('Logger')
const moment = require('moment')
class TenantController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
    Logger.info(
      `websocket subscribe start ${auth.user.id} ${socket.topic} ${moment
        .utc(new Date())
        .toISOString()}`
    )
    this.subscribe({ channel: WEBSOCKET_TENANT_REDIS_KEY })
    this.unsubscribe({ channel: WEBSOCKET_TENANT_REDIS_KEY })
  }
}

module.exports = TenantController
