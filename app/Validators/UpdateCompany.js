'use strict'

const yup = require('yup')

const Base = require('./Base')
const {
  COMPANY_TYPE_PRIVATE,
  COMPANY_TYPE_PROPERTY_MANAGER,
  COMPANY_TYPE_PRIVATE_HOUSING,
  COMPANY_TYPE_MUNICIPAL_HOUSING,
  COMPANY_TYPE_HOUSING_COOPERATIVE,
  COMPANY_TYPE_LISTED_HOUSING,
  COMPANY_TYPE_BROKER,
  COMPANY_SIZE_SMALL,
  COMPANY_SIZE_MID,
  COMPANY_SIZE_LARGE,
} = require('../constants')

class UpdateCompany extends Base {
  static schema = () => {
    return yup.object().shape({
      name: yup.string().max(255).required(),
      tax_number: yup.string().max(255),
      trade_register_nr: yup.string().max(255),
      umsst: yup.string().max(255),
      size: yup.string().oneOf([COMPANY_SIZE_SMALL, COMPANY_SIZE_MID, COMPANY_SIZE_LARGE]),
      type: yup
        .string()
        .oneOf([
          COMPANY_TYPE_PRIVATE,
          COMPANY_TYPE_PROPERTY_MANAGER,
          COMPANY_TYPE_PRIVATE_HOUSING,
          COMPANY_TYPE_MUNICIPAL_HOUSING,
          COMPANY_TYPE_HOUSING_COOPERATIVE,
          COMPANY_TYPE_LISTED_HOUSING,
          COMPANY_TYPE_BROKER,
        ]),
      avatar: yup.mixed(),
    })
  }
}

module.exports = UpdateCompany
