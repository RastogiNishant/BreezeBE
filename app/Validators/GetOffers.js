'use strict'

const yup = require('yup')

const Base = require('./Base')
const { COUNTRIES, RENT_DURATION_SHORT, RENT_DURATION_LONG } = require('../constants')
const getValidCountryCodes = () => {
  const country_codes = COUNTRIES.map((country) => country.country_code)
  return country_codes
}
class GetOffers extends Base {
  static schema = () =>
    yup.object().shape({
      country_code: yup
        .string()
        .oneOf(getValidCountryCodes())
        .required('Country code is required.'),
      rent_max: yup.number().required('Rent max is required.'),
      city: yup.string().required('City is required.'),
      duration: yup
        .string()
        .oneOf([RENT_DURATION_SHORT, RENT_DURATION_LONG])
        .required('duration is required'),
    })
}

module.exports = GetOffers
