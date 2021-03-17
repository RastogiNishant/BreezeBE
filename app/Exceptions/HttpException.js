'use strict'

const { LogicalException } = require('@adonisjs/generic-exceptions')

class HttpException extends LogicalException {
  constructor(message, status, code, errShLink) {
    super(message, status, code, errShLink)
    this.code = code
  }
}

module.exports = HttpException
