'use strict'
const BaseController = require('./BaseController')

class TaskController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
    const matches = this.socket.topic.match(/^task:[0-9]+brz([0-9]+)$/)
    this.taskId = matches[1]
  }

  //this is not needed anymore...
  onTaskInit() {
    let count = 0
    let doMore = true
    let qs = []
    do {
      if (origQuestions[count].type !== 'not-a-question') {
        doMore = false
      }
      qs.push(origQuestions[count])
      count++
    } while (doMore)
    this.broadcast(qs, 'question', 0)
  }

  async onMarkLastRead() {
    super._markLastRead(this.taskId)
  }

  onMessage(message) {
    super.onMessage(message)
    this._saveToChats(message, this.taskId)
  }
}

module.exports = TaskController
