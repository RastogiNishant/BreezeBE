'use strict'

const { LogicalException } = require('@adonisjs/generic-exceptions')

class HttpException extends LogicalException {
  /**
   * Handle this exception by itself
   */
  // handle () {}
}

module.exports = HttpException
