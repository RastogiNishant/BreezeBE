'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class MatchContactMultiple extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required('estate_id is required'),
      recipients: yup.array().of(id).required(),
      message: yup.string().min(5).max(360).required(),
      mode: yup.string().oneOf(['email', 'chat']).required()
    })
}

module.exports = MatchContactMultiple
