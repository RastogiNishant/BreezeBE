'use strict'
const Base = require('./Base')
const yup = require('yup')
const {
  ESTATE_CUSTOM_AMENITY_MAX_STRING_LENGTH,
  ESTATE_AMENITY_LOCATIONS,
} = require('../constants')
const CreateEstateAmenity = require('./CreateEstateAmenity')

class CreateBulkEstateAmenities extends Base {
  static schema = () =>
    yup.object().shape({
      amenities: yup.array().of(CreateEstateAmenity.schema()).required(),
    })
}

module.exports = CreateBulkEstateAmenities
