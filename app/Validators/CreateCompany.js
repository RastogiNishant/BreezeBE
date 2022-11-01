'use strict'

const Base = require('./Base')
const yup = require('yup')
const {
  COMPANY_TYPE_PRIVATE,
  COMPANY_TYPE_PROPERTY_MANAGER,
  COMPANY_TYPE_PRIVATE_HOUSING,
  COMPANY_TYPE_MUNICIPAL_HOUSING,
  COMPANY_TYPE_HOUSING_COOPERATIVE,
  COMPANY_TYPE_LISTED_HOUSING,
  COMPANY_SIZE_SMALL,
  COMPANY_SIZE_MID,
  COMPANY_SIZE_LARGE,
} = require('../constants')

class CreateCompany extends Base {
  static schema = () => {
    return yup.object().shape({
      name: yup.string().max(255),
      tax_number: yup.string().max(255),
      trade_register_nr: yup.string().max(255),
      umsst: yup.string().max(255),
      size: yup
        .string()
        .oneOf([COMPANY_SIZE_SMALL, COMPANY_SIZE_MID, COMPANY_SIZE_LARGE])
        .required(),
      type: yup
        .string()
        .oneOf([
          COMPANY_TYPE_PRIVATE,
          COMPANY_TYPE_PROPERTY_MANAGER,
          COMPANY_TYPE_PRIVATE_HOUSING,
          COMPANY_TYPE_MUNICIPAL_HOUSING,
          COMPANY_TYPE_HOUSING_COOPERATIVE,
          COMPANY_TYPE_LISTED_HOUSING,
        ])
        .required(),
      is_onboard: yup.boolean(),
      // address: yup.string().when(['is_onboard'], {
      //   is: (is_onboard) => {
      //     console.log('isOnboard here=', is_onboard)
      //     return !is_onboard
      //   },
      //   then: yup.string().min(10).required(),
      //   otherwise: yup.string().min(10),
      // }),
    })
  }
}

module.exports = CreateCompany
