'use strict'

const yup = require('yup')
const Base = require('./Base')
const { THIRD_PARTY_OFFER_SOURCES } = require('../constants')

class CreateThirdPartyOffer extends Base {
  static schema = () =>
    yup.object().shape({
      source: yup.string().oneOf(THIRD_PARTY_OFFER_SOURCES).required(),
      source_id: yup.number().positive().required(),
      coord: yup.string().matches(),
      description: yup.string(),
      url: yup
        .string()
        .matches(
          /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/
        ),
      house_number: yup.string().max(10),
      street: yup.string().max(100),
      city: yup.string().max(100),
      zip: yup.string().max(10),
    })
}

module.exports = CreateThirdPartyOffer
