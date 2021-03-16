'use strict'

const Promise = require('bluebird')
const { get, uniqueId, isEmpty } = require('lodash')

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
  static async sendNotification(tokens, { body, data, title = '' }, noDeffer = false) {
    // send deferred
    const options = {
      notification: {
        title: title || body,
        body: body,
      },
      data: {
        messageId: uniqueId(`m_${uTime}_`),
        body,
        title,
        ...data,
      },
    }

    return NotificationsService.sendRaw(tokens, options)
  }

  /**
   *
   */
  static async send(tokens, message, data, title) {
    return NotificationsService.sendNotification(tokens, {
      body: message,
      title: title || message,
      data,
    })
  }
}

module.exports = NotificationsService
