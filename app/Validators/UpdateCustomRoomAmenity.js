'use strict'
const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas')

class UpdateCustomRoomAmenity extends Base {
  static schema = () =>
    yup.object().shape({
      action: yup
        .string()
        .oneOf(['update', 'reorder'])
        .required('action is required and must be either update or reorder.'),
      id: id.when('action', {
        is: 'update',
        then: id.required('id must be set'),
      }),
      amenity_ids: yup.array().when('action', {
        is: 'reorder',
        then: yup
          .array()
          .of(yup.number().integer())
          .required()
          .typeError('amenity_ids must be an array of integers.'),
      }),
      amenity: yup.string().when('action', {
        is: 'update',
        then: yup.string().min(3).max(22).required('amenity is required.'),
      }),
    })
}

module.exports = UpdateCustomRoomAmenity
