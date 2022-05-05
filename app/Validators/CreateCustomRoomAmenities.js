'use strict'
const Base = require('./Base')
const yup = require('yup')

class CreateCustomRoomAmenities extends Base {
  static schema = () =>
    yup.object().shape({
      amenity: yup.string().min(3).max(22).required('custom amenity name is required.'),
    })
}

module.exports = CreateCustomRoomAmenities
