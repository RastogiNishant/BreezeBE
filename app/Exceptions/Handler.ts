'use strict'

import { get } from 'lodash'
import Express from 'express'
import * as Sentry from '@sentry/node'

const BaseExceptionHandler = use('BaseExceptionHandler')
const Logger = use('Logger')
// const Sentry = use('Sentry')

interface Error {
  name: string
  code: number
  status: number
  message: string
  messages?: Array<{ field: string, validation: string }>
  stack: string
}

/**
 * This class handles all exceptions thrown during
 * the HTTP request lifecycle.
 *
 * @class ExceptionHandler
 */
export class ExceptionHandler extends BaseExceptionHandler {
  /**
   * Handle exception thrown during the HTTP lifecycle
   */
  async handle (
    error: Error,
    {
      request,
      response
    }: { request: Express.Request, response: Express.Response }
  ): Promise<void> {
    if (error.name === 'ValidationException') {
      return response.status(422).json({
        status: 'error',
        data: error.messages?.reduce(
          (n, i) => ({ ...n, [i.field]: i.validation }),
          {}
        )
      })
    }

    if (['ModelNotFoundException', 'HttpException'].includes(error.name)) {
      return response.status(error.status).json({
        status: 'error',
        data: error.message,
        code: error.code ?? 0
      })
    }

    response.status(error.status).send(error.message)
  }

  /**
   * Report exception for logging or debugging.
   */
  async report (
    error: Error,
    {
      request,
      auth
    }: {
      request: Express.Request
      auth: { user: { username: string, id: number } }
    }
  ): Promise<boolean> {
    // Systems 404 HttpException do not report
    if (error.name === 'HttpException' && error.status === 404) {
      return false
    }

    Logger.info(JSON.stringify(request.all(), null, 2))

    if (error.name === 'ValidationException') {
      return false
    }

    Sentry.withScope((scope: Sentry.Scope) => {
      scope.setExtra('url', request.request.url)
      scope.setExtra('data', request.all())
      scope.setUser({ id: get(auth, 'user.id'), username: get(auth, 'user.username', 'anonymous') })
      Sentry.captureException(error)
    })

    if (process.env.NODE_ENV !== undefined) {
      Logger.error(`${error.message} \n${error.stack}\n\n`)
    }

    return true
  }
}

// node compatible
module.exports = new ExceptionHandler()
