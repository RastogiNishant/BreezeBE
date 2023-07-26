'use strict'
const { WEBSOCKET_TENANT_REDIS_KEY } = require('../../constants')
const BaseController = require('./BaseController')
const Redis = use('Redis')
const ChatService = use('App/Services/ChatService')
class TenantController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
    this.subscribe({ channel: WEBSOCKET_TENANT_REDIS_KEY })
    this.unsubscribe({ channel: WEBSOCKET_TENANT_REDIS_KEY })
  }
}

module.exports = TenantController
