'use strict'

const yup = require('yup')
const Base = require('./Base')

class AddEstateSyncApiKey extends Base {
  static schema = () =>
    yup.object().shape({
      api_key: yup.string().required('api_key is required.')
    })
}

module.exports = AddEstateSyncApiKey
