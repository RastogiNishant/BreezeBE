'use strict'

const yup = require('yup')
const Base = require('./Base')

class SendMessageToMarketplaceProspect extends Base {
  static schema = () =>
    yup.object().shape({
      contact_request_id: yup
        .number()
        .integer()
        .positive()
        .required('contact_request_id is required'),
      message: yup.string().min(1).max(1000).required('message is required')
    })
}

module.exports = SendMessageToMarketplaceProspect
