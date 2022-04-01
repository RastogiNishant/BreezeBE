'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  LANG_DE, LANG_EN
} = require('../constants')

class ResetEmailRequest extends Base {
  static schema = () =>
    yup.object().shape({
      email: yup.string().email().lowercase().required(),
      from_web: yup.boolean(),
      lang:yup.string().oneOf([LANG_DE,LANG_EN])
    })
}

module.exports = ResetEmailRequest