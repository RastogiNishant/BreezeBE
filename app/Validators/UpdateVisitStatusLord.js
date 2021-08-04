'use strict'

const yup = require('yup')
const { get } = require('lodash')

const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

const {
  TIMESLOT_STATUS_CONFIRM,
  TIMESLOT_STATUS_REJECT,
  TIMESLOT_STATUS_DELAY,
} = require('../constants')

const delay = yup.number().integer().positive().max(360)

class UpdateVisitStatusLord extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
      status: yup
        .string()
        .oneOf([TIMESLOT_STATUS_CONFIRM, TIMESLOT_STATUS_REJECT, TIMESLOT_STATUS_DELAY]),
      delay: yup.lazy((value, values) => {
        const status = get(values, 'parent.status')
        return status === TIMESLOT_STATUS_DELAY ? delay.required() : delay
      })
    })
}

module.exports = UpdateVisitStatusLord
