'use strict'

const { uniqueId } = require('lodash')

/** @type {typeof import('/providers/Notifications')} */
const Notifications = use('Notifications')
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
        payload: {
          ...data,
        },
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
   * notification_prospect_fill_profile
   */
  static async sendProspectFillProfile() {
    const tokens = []
    const TYPE = 'notification_prospect_fill_profile'
    return NotificationsService.sendNotification(tokens, TYPE, {
      title: "Let's start knocking",
      body: 'Complete your profile & preferences\nYou will be notified about matches',
      data: {},
    })
  }
}

module.exports = NotificationsService
