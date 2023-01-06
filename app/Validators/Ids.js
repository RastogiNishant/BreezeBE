'use strict'

const yup = require('yup')
const {
  getExceptionMessage,
  exceptionKeys: { ARRAY },
} = require('../excepions')

const Base = require('./Base')
class Ids extends Base {
  static schema = () =>
    yup.object().shape({
      ids: yup
        .array()
        .of(yup.number().integer().positive())
        .required()
        .typeError(getExceptionMessage('ids', ARRAY)),
    })
}

module.exports = Ids
