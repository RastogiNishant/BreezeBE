'use strict'
const Base = require('./Base')
const yup = require('yup')

class CreateRoomAmenity extends Base {
  static schema = () =>
    yup.object().shape({
      type: yup.string().oneOf(['amenity', 'custom_amenity']),
      amenity: yup.string().when('type', {
        is: 'custom-amenity',
        then: yup.string().min(3).max(22).required('custom amenity name is required.'),
      }),
      option_id: yup.number().when('type', {
        is: 'amenity',
        then: yup.number().integer().positive().required('room amenity is required.'),
      }),
    })
}

module.exports = CreateRoomAmenity
