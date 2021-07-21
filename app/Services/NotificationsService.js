'use strict'

const { uniqueId, isEmpty } = require('lodash')

/** @type {typeof import('/providers/Notifications')} */
const Notifications = use('Notifications')
const l = use('Localize')
const uTime = require('moment')().format('X')

class NotificationsService {
  static async sendRaw(tokens, options) {
    return Notifications.send(tokens, options)
  }

  /**
   * Send notification and add job for deferred send
   */
  static async sendNotification(tokens, type, { body, data, title = '' }) {
    // send deferred
    const options = {
      notification: {
        title: title || body,
        body: body || title,
      },
      data: {
        type,
        messageId: uniqueId(`m_${uTime}_`),
        body,
        title,
        payload: isEmpty(data) ? '' : data,
      },
    }

    return NotificationsService.sendRaw(tokens, options)
  }

  /**
   *
   */
  static async send(tokens, type, message, data, title) {
    return NotificationsService.sendNotification(tokens, type, {
      body: message,
      title: title || message,
      data: {
        payload,
      },
    })
  }

  /**
   * notification_landlord_new_property
   */
  static async sendLandlordNewProperty() {
    // const tokens = [
    //   'ctT0VRPoSw2KuCaX2MOfT-:APA91bHyL-1maKPlngJ87BPje9HGSgHkSND2JR8Ynn10Hc4kkdGTkfCJssmqQv-o2up_v4lWcrlIPwJRH7RLmJgH3RnXCxpwTUTdHse3bBkSDSwTtYIXHLs0xSNPBsJ4SOI5NU2hmaZJ',
    // ]
    const TYPE = 'notification_landlord_new_property'
    return NotificationsService.sendNotification(tokens, TYPE, {
      title: l.get('landlord.notification.event.no_prop_profile'),
      body: l.get('landlord.notification.tip.no_prop_profile'),
      data: {},
    })
  }
}

module.exports = NotificationsService
