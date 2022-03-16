'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')
const {
    ROLE_LANDLORD, ROLE_USER
  } = require('../constants')

class RoleId extends Base {
  static schema = () =>
    yup.object().shape({
        role_id: yup.number().oneOf([ROLE_LANDLORD, ROLE_USER]),
    })
}

module.exports = RoleId
