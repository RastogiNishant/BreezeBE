'use strict'

const BaseController = require('./BaseController')

//endpoint for Estate
//we'll retain this for now. We'll be using this on notifications.
//ie. once landlord/tenant went through the create task flow, he needs to send
//an event here like taskCreated. This will enable all those listening to this
//topic to act accordingly and do something like connect to this topic and start
//messaging there.
class EstateController extends BaseController {
  constructor({ socket, auth, request }) {
    super({ socket, auth, request, channel: 'estate' })
  }

  async onMessage(message) {
    //super.onMessage(message)
    //we're not attaching estates to chats for now so NOT saving this.
    //this should be saved though IMHO
    //await super._saveToChats(message, this.user.id, this.estate_id)
  }

  async onTaskCreated(message) {
    //we'll populate this later on
  }
}

module.exports = EstateController
