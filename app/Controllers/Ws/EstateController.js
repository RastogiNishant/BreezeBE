'use strict'

const BaseController = require('./BaseController')

//endpoint for Estate
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

  async onCreateTask() {
    super.emitToSender({ task_id: 1 }, 'taskCreated', 0)
  }
}

module.exports = EstateController
