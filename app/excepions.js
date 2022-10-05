const HttpException = use('App/Exceptions/HttpException')
const { replace } = require('lodash')

const exceptions = {
  REQUIRED: 'is a required field',
  MINLENGTH: 'must be at least ${value} characters',
  MAXLENGTH: 'must be at most ${value} characters',
  OPTION: 'must be one of the following values:${value}',
  DATE: 'must be a `YYYY-MM-DD` type',
  BOOLEAN: 'must be true or false',
  EMAIL: 'must be a valid email',
  MATCH: 'format is wrong',
}

const exceptionKeys = {
  REQUIRED: 'REQUIRED',
  MINLENGTH: 'MINLENGTH',
  MAXLENGTH: 'MAXLENGTH',
  OPTION: 'OPTION',
  DATE: 'DATE',
  BOOLEAN: 'BOOLEAN',
  EMAIL: 'EMAIL',
  MATCH: 'MATCH',
}
const getExceptionMessage = (name, command, value = null) => {
  if (!exceptions[command]) {
    throw new HttpException(`message for ${command} is not defined`)
  }

  return `${name || ''} ${replace(exceptions[command], '${value}', value)}`
}

module.exports = {
  exceptions,
  exceptionKeys,
  getExceptionMessage,
}
