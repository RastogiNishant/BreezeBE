'use strict'

const { WEBSOCKET_TENANT_REDIS_KEY, WEBSOCKET_LANDLORD_REDIS_KEY } = require('../constants')

const Redis = require('ioredis')
const Ws = use('Ws')
class WebSocket {
  static redisSubscriber = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  })

  static redisPublisher = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  })

  static unsubscribe(topic) {
    console.log('unsubscribe=', topic)
    this.redisSubscriber.unsubscribe(topic)
  }

  static getSubscriber() {
    return this.redisSubscriber
  }

  static subscribe(topic) {
    // Subscribe to a channel
    this.redisSubscriber.subscribe(topic, (err, count) => {
      if (err) {
        console.error('Error subscribing to channel:', err)
        return
      }
    })
  }

  static publish({ topic, channel, event, data }) {
    this.redisPublisher?.publish(topic, JSON.stringify({ event, data, channel }), (err, count) => {
      if (err) {
        console.error('Error publishing message:', err)
        return
      }
    })
  }

  static publishToTenant({ event, userId, data }) {
    WebSocket.publish({
      topic: `${WEBSOCKET_TENANT_REDIS_KEY}:${userId}`,
      channel: 'tenant:*',
      event,
      data,
    })
  }

  static publishToLandlord({ event, userId, data }) {
    WebSocket.publish({
      topic: `${WEBSOCKET_LANDLORD_REDIS_KEY}:${userId}`,
      channel: 'landlord:*',
      event,
      data,
    })
  }
}

WebSocket.redisSubscriber.on('message', (channel, message) => {
  const object = JSON.parse(message)
  if (!object?.event || !object?.data) {
    return true
  }

  const topic = Ws?.getChannel(object?.channel || `landlord:*`)?.topic(channel)
  topic?.broadcast(object.event, object.data)
})

module.exports = WebSocket
