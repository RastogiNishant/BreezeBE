'use strict'

const yup = require('yup')
const Base = require('./Base')
const moment = require('moment')
const { DATE_FORMAT } = require('../constants')

class RequestProspectProfile extends Base {
  static schema = () =>
    yup.object().shape({
      estateId: yup.number().positive().required().typeError('estateId must be an integer.'),
      prospectId: yup.number().positive().required().typeError('prospectId must be an integer.'),
      date: yup
        .date()
        .required()
        .transform((value, origin) => {
          return moment.utc(origin, DATE_FORMAT).toDate()
        })
    })
}

module.exports = RequestProspectProfile
