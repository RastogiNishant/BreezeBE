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
  COMPANY_SIZE_SMALL,
  COMPANY_SIZE_MID,
  COMPANY_SIZE_LARGE,
} = require('../constants')

class UpdateCompany extends Base {
  static schema = () => {
    return yup.object().shape({
      // email: yup.string().email().lowercase(),
      // phone: yup.string(),
      name: yup.string().max(255).required(),
      // address: yup
      //   .string()
      //   // .matches(
      //   //   /^([A-Za-zÀ-ž\u0370-\u03FF\u0400-\u04FF\-\s\(\)\.]+)\s+\d+[\-]{0,1}\d*(,\s)(\d){4,5}([A-Za-zÀ-ž\u0370-\u03FF\u0400-\u04FF\-\s\(\)\.]+)(,\s*[A-Za-zÀ-ž\u0370-\u03FF\u0400-\u04FF\-\s\(\)\.]+)?$/,
      //   //   'Address format is wrong'
      //   // )
      //   .min(10),
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
        ]),
    })
  }
}

module.exports = UpdateCompany
