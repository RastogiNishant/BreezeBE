'use strict'

const { get } = require('lodash')

const BaseExceptionHandler = use('BaseExceptionHandler')
const Logger = use('Logger')
const Sentry = use('Sentry')

/**
 * This class handles all exceptions thrown during
 * the HTTP request lifecycle.
 *
 * @class ExceptionHandler
 */
class ExceptionHandler extends BaseExceptionHandler {
  /**
   * Handle exception thrown during the HTTP lifecycle
   */
  async handle(error, { request, response }) {
    if (error.name === 'ValidationException') {
      return response
        .status(422)
        .json(error.messages.reduce((n, i) => ({ ...n, [i.field]: i.validation }), {}))
    }

    response.status(error.status).send(error.message)
  }

  /**
   * Report exception for logging or debugging.
   */
  async report(error, { request, auth }) {
    // Systems 404 HttpException do not out
    if (error.name === 'HttpException' && error.status === 404) {
      return false
    }

    Logger.info(JSON.stringify(request.all(), null, 2))

    if (error.name === 'ValidationException') {
      return false
    }

    Sentry.withScope((scope) => {
      scope.setExtra('username', get(auth, 'user.username', 'anonymous'))
      scope.setExtra('user_id', get(auth, 'user.id', null))
      scope.setExtra('data', request.all())
      Sentry.captureException(error)
    })

    if (process.env.NODE_ENV) {
      Logger.error(`${error.message} \n${error.stack}\n\n`)
    }
  }
}

module.exports = ExceptionHandler
