'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  THIRD_PARTY_OFFER_SOURCES,
  STATUS_ACTIVE,
  STATUS_EXPIRE,
  VALID_URL_REG_EXP,
} = require('../constants')
const moment = require('moment')
const currentYear = moment().format('Y')

class CreateThirdPartyOffer extends Base {
  static schema = () =>
    yup.object().shape({
      source: yup.string().oneOf(THIRD_PARTY_OFFER_SOURCES).required(),
      source_id: yup.number().positive().required(),
      coord: yup.string().matches(/[0-9\.]+,[0-9\.]+/),
      description: yup.string(),
      url: yup.string().matches(VALID_URL_REG_EXP),
      house_number: yup.string().max(10),
      street: yup.string().max(100),
      city: yup.string().max(100),
      zip: yup.string().max(10),
      country: yup.string().max(50),
      address: yup.string().max(255),
      floor: yup.number().integer().nullable(),
      floor_count: yup.number().integer().nullable(),
      bathrooms: yup.number().integer().nullable(),
      rooms: yup.number().nullable(),
      area: yup.number().integer().nullable(),
      construction_year: yup.number().min(1000).max(+currentYear).nullable(),
      images: yup.string(),
      energy_efficiency_class: yup
        .string()
        .matches(/^[A-H]{1}[\-\+]*$/)
        .nullable(),
      vacant_from: yup.string().matches(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/),
      visit_from: yup.string().matches(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/),
      visit_to: yup.string().matches(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/),
      status: yup.number().oneOf([STATUS_ACTIVE, STATUS_EXPIRE]),
      amenities: yup.array().of(yup.string()),
      coord_raw: yup.string().matches(/[0-9\.]+,[0-9\.]+/),
      expiration_date: yup.string().matches(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/),
      price: yup.number(),
      contact: yup.object(),
    })
}

module.exports = CreateThirdPartyOffer
