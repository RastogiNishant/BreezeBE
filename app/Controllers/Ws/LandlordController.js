'use strict'
const {
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_INPROGRESS_LABEL,
  URGENCY_SUPER_LABEL,
  NOT_CONNECTED_BREEZE_TEANT_LABEL,
  PENDING_BREEZE_TEANT_LABEL,
} = require('../../constants')
const BaseController = require('./BaseController')
const ChatService = use('App/Services/ChatService')
const EstateService = use('App/Services/EstateService')
const Logger = use('Logger')
class LandlordController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
  }

  async onGetTaskInProgressCount() {
    try {
      const count =
        (
          await EstateService.getTotalLetCount(
            this.user.id,
            {
              status: {
                operator: 'and',
                matchMode: 'in',
                value: [TASK_STATUS_INPROGRESS_LABEL],
              },
            },
            true
          )
        ).length || 0
      if (this.topic) {
        //this will send back to sender...
        this.topic.emitTo('taskInProgressCount', { count: count }, [this.socket.id])
      }
    } catch (e) {
      Logger.error(`onGetTaskInProgressCount error ${e.message || e}`)
    }
  }

  async onGetTaskUrgentCount() {
    try {
      const count =
        (
          await EstateService.getTotalLetCount(
            this.user.id,
            {
              urgency: {
                operator: 'and',
                matchMode: 'in',
                value: [URGENCY_SUPER_LABEL],
              },
            },
            true
          )
        ).length || 0
      if (this.topic) {
        //this will send back to sender...
        this.topic.emitTo('taskUrgentCount', { count: count }, [this.socket.id])
      }
    } catch (e) {
      Logger.error(`onGetTaskUrgentCount error ${e.message || e}`)
    }
  }

  async onGetNotInvitedCount() {
    try {
      const count =
        (
          await EstateService.getTotalLetCount(
            this.user.id,
            {
              breeze_type: {
                operator: 'and',
                matchMode: 'in',
                value: [NOT_CONNECTED_BREEZE_TEANT_LABEL],
              },
            },
            true
          )
        ).length || 0
      if (this.topic) {
        //this will send back to sender...
        this.topic.emitTo('notInvitedCount', { count: count }, [this.socket.id])
      }
    } catch (e) {
      Logger.error(`onGetNotInvitedCount error ${e.message || e}`)
    }
  }

  async onGetPendingInviteCount() {
    try {
      const count =
        (
          await EstateService.getTotalLetCount(
            this.user.id,
            {
              breeze_type: {
                operator: 'and',
                matchMode: 'in',
                value: [PENDING_BREEZE_TEANT_LABEL],
              },
            },
            true
          )
        ).length || 0
      if (this.topic) {
        //this will send back to sender...
        this.topic.emitTo('pendingInviteCount', { count: count }, [this.socket.id])
      }
    } catch (e) {
      Logger.error(`onGetPendingInviteCount error ${e.message || e}`)
    }
  }
}

module.exports = LandlordController
