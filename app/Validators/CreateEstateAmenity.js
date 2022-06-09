'use strict'
const Base = require('./Base')
const yup = require('yup')
const {
  ESTATE_CUSTOM_AMENITY_MAX_STRING_LENGTH,
  ESTATE_AMENITY_LOCATIONS,
} = require('../constants')

class CreateEstateAmenity extends Base {
  static schema = () =>
    yup.object().shape({
      type: yup.string().oneOf(['amenity', 'custom_amenity']),
      amenity: yup.string().when('type', {
        is: 'custom_amenity',
        then: yup
          .string()
          .test(
            'len',
            `Custom amenity must be at least one character and less than or equal to ${ESTATE_CUSTOM_AMENITY_MAX_STRING_LENGTH} characters`,
            (val) => val && val.length >= 1 && val.length <= ESTATE_CUSTOM_AMENITY_MAX_STRING_LENGTH
          )
          .typeError('Custom amenity must have at least 1 character.')
          .required('Custom amenity name is required.'),
      }),
      option_id: yup.number().when('type', {
        is: 'amenity',
        then: yup.number().integer().positive().required('Estate amenity is required.'),
      }),
      estate_id: yup.number().integer().positive().required('Estate Id is required'),
      location: yup.string().oneOf(ESTATE_AMENITY_LOCATIONS),
    })
}

module.exports = CreateEstateAmenity
