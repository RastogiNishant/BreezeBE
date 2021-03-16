'use strict'

const { LogicalException } = require('@adonisjs/generic-exceptions')

class AppException extends LogicalException {
  constructor(message, code, ...props) {
    super(message, code, ...props)
    this.code = code
  }
}

module.exports = AppException
