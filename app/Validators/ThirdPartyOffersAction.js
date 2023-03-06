'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED },
} = require('../exceptions')

class ThirdPartyOffersAction extends Base {
  static schema = () => {
    return yup.object().shape({
      id: yup.number().integer().required(getExceptionMessage('id', REQUIRED)),
      action: yup
        .string()
        .oneOf(['like', 'dislike', 'comment', 'knock', 'contact'])
        .required(getExceptionMessage('action', REQUIRED)),
      comment: yup.string().when('action', {
        is: 'comment',
        then: yup.string().required(getExceptionMessage('comment', REQUIRED)),
      }),
      message: yup.string().when('action', {
        is: 'contact',
        then: yup.string().required(getExceptionMessage('message', REQUIRED)),
      }),
    })
  }
}

module.exports = ThirdPartyOffersAction
