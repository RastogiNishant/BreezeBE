'use strict'

const yup = require('yup')
const Base = require('./Base')
const { THIRD_PARTY_OFFER_SOURCES, STATUS_ACTIVE, STATUS_EXPIRE } = require('../constants')
const moment = require('moment')
const currentYear = moment().format('Y')

class CreateThirdPartyOffer extends Base {
  static schema = () =>
    yup.object().shape({
      source: yup.string().oneOf(THIRD_PARTY_OFFER_SOURCES).required(),
      source_id: yup.number().positive().required(),
      coord: yup.string().matches(/[0-9\.]+,[0-9\.]+/),
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
      country: yup.string().max(50),
      address: yup.string().max(255),
      floor: yup.number().integer(),
      floor_count: yup.number().integer(),
      bathrooms: yup.number().integer(),
      rooms: yup.number(),
      area: yup.number().integer(),
      construction_year: yup.number().min(1000).max(+currentYear),
      images: yup.object(),
      energy_efficiency_class: yup.string().matches(/^[A-F]{1}[\-\+]?$/),
      vacant_from: yup.date().min(moment().format('Y-m-d')),
      visit_from: yup.date().min(moment().format('Y-m-d')),
      visit_to: yup.date().min(moment().format('Y-m-d')),
      status: yup.number().oneOf([STATUS_ACTIVE, STATUS_EXPIRE]),
      amenities: yup.array().of(yup.string()),
      coord_raw: yup.string().matches(/[0-9\.]+,[0-9\.]+/),
      expiration_date: yup.date().min(moment().format('Y-m-d')),
      price: yup.number(),
      contact: yup.object(),
    })
}

module.exports = CreateThirdPartyOffer
