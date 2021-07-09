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
} = require('../constants')

class UpdateCompany extends Base {
  static schema = () => {
    return yup.object().shape({
      // email: yup.string().email().lowercase(),
      // phone: yup.string(),
      name: yup.string().max(255),
      address: yup.string().max(255),
      tax_number: yup.string().max(255),
      trade_register_nr: yup.string().max(255),
      umsst: yup.string().max(255),
      type: yup
        .string()
        .oneOf([
          COMPANY_TYPE_PRIVATE,
          COMPANY_TYPE_PROPERTY_MANAGER,
          COMPANY_TYPE_PRIVATE_HOUSING,
          COMPANY_TYPE_MUNICIPAL_HOUSING,
          COMPANY_TYPE_HOUSING_COOPERATIVE,
          COMPANY_TYPE_LISTED_HOUSING,
        ]),
    })
  }
}

module.exports = UpdateCompany
