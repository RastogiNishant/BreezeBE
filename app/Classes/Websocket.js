'use strict'
const Redis = use('Redis')

class WebSocket {
  static publish({ event, data }) {
    Redis.publish('websocket', JSON.stringify({ event, data }))
  }
}

module.exports = WebSocket
