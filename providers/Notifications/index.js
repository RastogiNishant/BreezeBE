'use strict'

/**
 * @module Notifications
 */
const admin = require('firebase-admin')
const { isArray, isString, isEmpty, isDate, reduce, toString, get, isObject } = require('lodash')

class Notifications {
  constructor(settings, Sentry) {
    this.Sentry = Sentry
    admin.initializeApp({
      credential: admin.credential.cert(settings),
    })
  }

  /**
   *
   */
  static isValidToken(token) {
    return isString(token) && token.length > 64
  }

  /**
   *
   */
  async send(tokens, data) {
    tokens = isArray(tokens) ? tokens : [tokens]
    tokens.filter((i) => {
      const isValid = Notifications.isValidToken(i)
      !isValid && console.log(`Invalid token: ${i}`)

      return isValid
    })

    if (isEmpty(tokens)) {
      return Promise.resolve()
    }

    // Map all data like string
    const dataToString = (data = {}) => {
      return reduce(
        data,
        (n, v, k) => {
          if (isDate(v)) {
            return { ...n, [k]: v.toISOString() }
          } else if (isArray(v)) {
            return { ...n, [k]: v.map((i) => dataToString(i)) }
          } else if (isObject(v)) {
            return { ...n, [k]: dataToString(v) }
          }

          return { ...n, [k]: toString(v) }
        },
        {}
      )
    }
    const message = dataToString(data)
    // message.notification.imageUrl =
    //   'https://icdn.lenta.ru/images/0000/0003/000000033224/detail_1358264090.jpg'
    // message.notification.image =
    //   'https://icdn.lenta.ru/images/0000/0003/000000033224/detail_1358264090.jpg'
    // message.data.click_action = 'FLUTTER_NOTIFICATION_CLICK'

    const options = {
      //contentAvailable: true,
      ttl: 30,
      priority: 'high',
      topic: 'com.breeze',
    }

    return admin
      .messaging()
      .sendToDevice(tokens, message, options)
      .then((result) => {
        const error = get(result, 'results.0.error')
        if (error) {
          this.Sentry.captureException(error)
        }

        console.log({
          tokens,
          successCount: result.successCount,
          failureCount: result.failureCount,
          messages: JSON.stringify(result.results, null, 2),
          message,
        })
        return result
      })
      .catch((e) => {
        this.Sentry.captureException(e)
        console.error(`Send notification error: ${e.message}`)
      })
  }
}

module.exports = Notifications
