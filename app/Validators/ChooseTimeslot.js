'use strict'

const moment = require('moment')
const yup = require('yup')

const Base = require('./Base')
const { id } = require('../Libs/schemas.js')
const { DATE_FORMAT } = require('../constants')

class ChooseTimeslot extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
      date: yup.date().transform((value, origin) => {
        return moment.utc(origin, DATE_FORMAT).toDate()
      }),
    })
}

module.exports = ChooseTimeslot
