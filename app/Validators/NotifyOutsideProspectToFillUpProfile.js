'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

class NotifyOutsideProspectToFillUpProfile extends Base {
  static schema = () =>
    yup.object().shape({
      id: yup.array().of(id).required('id is required')
    })
}

module.exports = NotifyOutsideProspectToFillUpProfile
