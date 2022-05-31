'use strict'
const yup = require('yup')
const Base = require('./Base')
const { ESTATE_AMENITY_LOCATIONS } = require('../constants')

class EstateAmenitiesLocation extends Base {
  static schema = () =>
    yup.object().shape({
      location: yup.string().oneOf(ESTATE_AMENITY_LOCATIONS),
    })
}

module.exports = EstateAmenitiesLocation
