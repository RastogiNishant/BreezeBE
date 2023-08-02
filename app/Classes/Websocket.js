'use strict'

const {
  WEBSOCKET_TENANT_REDIS_KEY,
  WEBSOCKET_LANDLORD_REDIS_KEY,
  WEBSOCKET_TASK_REDIS_KEY,
} = require('../constants')

const Redis = require('ioredis')
const Ws = use('Ws')
const moment = require('moment')
const Logger = use('Logger')

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

  static publichToTask({ event, taskId, estateId, data }) {
    WebSocket.publish({
      topic: `${WEBSOCKET_TASK_REDIS_KEY}:${estateId}brz${taskId}`,
      channel: 'task:*',
      event,
      data,
    })
  }
}

WebSocket.redisSubscriber.on('message', (channel, message) => {
  try {
    const object = JSON.parse(message)
    if (!object?.event || !object?.data) {
      return true
    }

    const topic = Ws?.getChannel(object?.channel || `landlord:*`)?.topic(channel)
    if (!topic) {
      Logger.info(`Topic not found ${message} ${moment.utc(new Date()).toISOString()}`)
    }
    if (object.data?.broadcast_all) {
      topic?.broadcastToAll(object.event, object.data)
    } else {
      topic?.broadcast(object.event, object.data)
    }
  } catch (e) {
    console.log('websocket subscribe error', e.message)
  }
})

module.exports = WebSocket
