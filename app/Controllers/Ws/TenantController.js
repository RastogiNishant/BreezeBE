'use strict'
const { WEBSOCKET_TENANT_REDIS_KEY } = require('../../constants')
const BaseController = require('./BaseController')

const Redis = use('Redis')
class TenantController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })

    Redis.subscribe(`${WEBSOCKET_TENANT_REDIS_KEY}_${this.user.id}`, (message) => {
      const object = JSON.parse(message)
      if (!object?.event || !object?.data) {
        return true
      }
      this.topic?.broadcast(object.event, object.data)
    })
  }
}

module.exports = TenantController
