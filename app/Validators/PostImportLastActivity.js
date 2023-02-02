'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED },
} = require('../exceptions')

class PostImportLastActivity extends Base {
  static schema = () =>
    yup.object().shape({
      filename: yup.string().required(getExceptionMessage('filename', REQUIRED)),
      type: yup.string().oneOf(['excel']).required(getExceptionMessage('type', REQUIRED)),
      entity: yup.string().oneOf(['estates']).required(getExceptionMessage('entity', REQUIRED)),
      action: yup
        .string()
        .oneOf(['import', 'export'])
        .required(getExceptionMessage('action', REQUIRED)),
    })
}

module.exports = PostImportLastActivity
