import type AdonisRequest from '@adonisjs/framework/src/Request'
import type AdonisResponse from '@adonisjs/framework/src/Response'
import * as compression from 'compression'

/**
 * Compress all requests that are delivered if compression library default config
 * suggests it.
 */
class CompressEndpoints {
  /**
   * Middleware calls on every request to the server
   */
  async handle (
    { request, response }: { request: AdonisRequest, response: AdonisResponse },
    next: Function
  ): Promise<void> {
    await new Promise((_resolve, _reject) => {
      compression()(request.request, response.response, _resolve)
    })

    await next()
  }
}

module.exports = CompressEndpoints
