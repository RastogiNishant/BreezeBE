'use strict'
const {
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_INPROGRESS_LABEL,
  URGENCY_SUPER_LABEL,
  NOT_CONNECTED_BREEZE_TEANT_LABEL,
  PENDING_BREEZE_TEANT_LABEL,
  WEBSOCKET_LANDLORD_REDIS_KEY,
} = require('../../constants')
const BaseController = require('./BaseController')
const EstateService = use('App/Services/EstateService')
const Logger = use('Logger')
const Redis = use('Redis')
const HttpException = use('App/Exceptions/HttpException')
class LandlordController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
    this.subscribe()

    socket.on('close', async () => {
      try {
        console.log(`WebSocket connection closed ${this?.user?.id}`)
        await Redis.unsubscribe(`${WEBSOCKET_LANDLORD_REDIS_KEY}_${this.user.id}`)
        console.log(`WebSocket connection closed XXXXX ${this?.user?.id}`)
        // Perform any cleanup or additional tasks upon WebSocket closure
      } catch (e) {
        console.log('connection close error', e.message)
      }
    })
  }

  async subscribe() {
    try {
      console.log('LandlordController subscribe=', this.user.id)
      await Redis.subscribe(`${WEBSOCKET_LANDLORD_REDIS_KEY}_${this.user.id}`, (message) => {
        const object = JSON.parse(message)
        if (!object?.event || !object?.data) {
          return true
        }
        console.log('Lanldlord subscribe=', this.topic)
        if (!this.topic) {
          return
        }

        this.topic.broadcast(object.event, object.data)
      })
    } catch (e) {
      console.log('LandlordController subscribe error', e.message)
      //throw new HttpException('Please try again')
    }
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
