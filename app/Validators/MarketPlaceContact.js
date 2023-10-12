'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')
class MarketPlaceContact extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
      email: yup.string().email().lowercase().max('255').required(),
      propertyId: yup.mixed(),
      prospect: yup.mixed(),
      contact_info: yup.mixed(),
      message: yup.string(),
      targetId: yup.string().required()
    })
}

module.exports = MarketPlaceContact
