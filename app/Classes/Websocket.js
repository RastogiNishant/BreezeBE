'use strict'

const { WEBSOCKET_TENANT_REDIS_KEY, WEBSOCKET_LANDLORD_REDIS_KEY } = require('../constants')

const Redis = use('Redis')

class WebSocket {
  static publish({ key, event, data }) {
    Redis.publish(key, JSON.stringify({ event, data }))
  }

  static publishToTenant({ event, userId, data }) {
    console.log('publishToTenant=', event)
    WebSocket.publish({ key: `${WEBSOCKET_TENANT_REDIS_KEY}_${userId}`, event, data })
  }

  static publishToLandlord({ event, userId, data }) {
    WebSocket.publish({ key: `${WEBSOCKET_LANDLORD_REDIS_KEY}_${userId}`, event, data })
  }
}

module.exports = WebSocket
