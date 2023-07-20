'use strict'
const BaseController = require('./BaseController')
const ChatService = use('App/Services/ChatService')
const Ws = use('Ws')
const Redis = use('Redis')
class TenantController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })

    this.topic = Ws.getChannel(this.socket.channel.name).topic(this.socket.topic)
    console.log('Tenant Controller here=', this.topic)

    // socket.on('message', (message) => {
    //   // Save the message in the database or process it as needed

    //   // Broadcast the message to all subscribers of the "chat" channel
    //   Redis.publish(
    //     'tenant',
    //     JSON.stringify({
    //       message,
    //     })
    //   )
    // })
  }

  static broadcast({ message, event = 'message', sender = null }) {
    console.log('Tenant Controller here broadcast', message)
    console.log(`BaseController broadcast start!!! ${message} `, this.topic)
  }
}

module.exports = TenantController
