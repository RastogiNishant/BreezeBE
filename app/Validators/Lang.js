'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

const { phoneSchema } = require('../Libs/schemas.js')

class Lang extends Base {
  static schema = () =>
    yup.object().shape({
      lang: yup.string().oneOf(['en', 'de']).default('en'),
    })
}

module.exports = Lang
