'use strict'

const yup = require('yup')
const Base = require('./Base')

class OutsideTenantInvite extends Base {
  static schema = () =>
    yup.object().shape({
      data1: yup.string().required(),
      data2: yup.string().required(),
    })
}

module.exports = OutsideTenantInvite
