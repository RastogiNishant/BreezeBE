'use strict'
import type AdonisRequest from '@adonisjs/framework/src/Request'
import type AdonisResponse from '@adonisjs/framework/src/Response'
import * as Sentry from '@sentry/node'

/**
 * Trace performance of any backend call in Sentry
 */
class SentryTransaction {
  /**
   * Middleware calls on every request to the server
   */
  async handle (
    { request, response }: { request: AdonisRequest, response: AdonisResponse },
    next: Function
  ): Promise<void> {
    const requestMethod = request.method() as string
    const requestUrl = request.url() as string
    const name = `${requestMethod} ${requestUrl}`
    const transaction = Sentry.startTransaction({
      name,
      op: 'http.server',
      origin: 'manual.sentry_middleware',
      metadata: {
        request: request.request,
        source: 'url'
      }
    })

    // register finish of backend process to close transaction
    response.adonisRequest.response.once('finish', () => {
      transaction.data = {
        user: request.auth,
        method: requestMethod,
        params: request.all()
      }
      transaction.setHttpStatus(response.adonisRequest.response.statusCode)
      transaction.finish()
    })

    // call next to advance the request
    await next()
  }
}

module.exports = SentryTransaction
