'use strict'

/**
 * adonis-logger
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const { ServiceProvider } = require('@adonisjs/fold')

class LoggerProvider extends ServiceProvider {
  boot() {
    const { env, excludeRoutes } = use('Adonis/Src/Config').get('app.httpLog')

    /**
     * Hook only when enabled for current NODE_ENV
     */
    if (!Array.isArray(env) || env.indexOf(process.env.NODE_ENV) > -1) {
      const HttpContext = use('Adonis/Src/HttpContext')
      const AdonisLogger = use('Adonis/Src/Logger')
      const Logger = require('./index')

      HttpContext.onReady(function (ctx) {
        const url = ctx.req.url
        // Do not log static
        if (url.match(/\.(js|json|css|ico|png|jpg|jpeg|woff|woff2|ttf|svg)$/i)) {
          return
        }

        if (Array.isArray(excludeRoutes) && excludeRoutes.includes(url)) {
          // Skip excludes
          return
        }

        const logger = new Logger(ctx, AdonisLogger)
        logger.hook()
      })
    }
  }
}

module.exports = LoggerProvider
