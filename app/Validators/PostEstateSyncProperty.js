'use strict'

const yup = require('yup')
const Base = require('./Base')

class PostEstateSyncProperty extends Base {
  static schema = () =>
    yup.object().shape({
      estateId: yup
        .number()
        .integer()
        .positive()
        .required('estate_id is required')
        .typeError('estate_ids must be an array of integers'),
      publishers: yup
        .array()
        .of(yup.string().oneOf(['immowelt', 'immobilienscout-24', 'ebay-kleinanzeigen']))
        .required('targets are required')
        .typeError(`must be an array containing immowelt, immobilienscout-24 or ebay-kleinanzeigen`)
    })
}

module.exports = PostEstateSyncProperty
