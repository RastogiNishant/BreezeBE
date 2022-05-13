'use strict'
const Base = require('./Base')
const yup = require('yup')
const { ROOM_CUSTOM_AMENITY_MAX_STRING_LENGTH } = require('../constants')

class CreateRoomAmenity extends Base {
  static schema = () =>
    yup.object().shape({
      type: yup.string().oneOf(['amenity', 'custom_amenity']),
      amenity: yup.string().when('type', {
        is: 'custom_amenity',
        then: yup
          .string()
          .test(
            'len',
            `Custom amenity must be less than or equal to ${ROOM_CUSTOM_AMENITY_MAX_STRING_LENGTH} characters`,
            (val) => val.length <= ROOM_CUSTOM_AMENITY_MAX_STRING_LENGTH
          )
          .required('custom amenity name is required.'),
      }),
      option_id: yup.number().when('type', {
        is: 'amenity',
        then: yup.number().integer().positive().required('room amenity is required.'),
      }),
    })
}

module.exports = CreateRoomAmenity
