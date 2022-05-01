'use strict'

const moment = require('moment')
const yup = require('yup')
const Base = require('./Base')
const { DATE_FORMAT } = require('../constants')

const transformTime = (value) => {
  const date = moment.utc(value, DATE_FORMAT)
  if (!date.isValid()) {
    return null
  }

  return date.format(DATE_FORMAT)
}

class UpdateSlot extends Base {
  static schema = () =>
    yup.object().shape({
      start_at: yup.string().transform(transformTime),
      end_at: yup
        .string()
        .transform(transformTime)
        .when('start_at', (startAt, schema, { value }) => {
          const begin = moment.utc(startAt, DATE_FORMAT)
          const end = moment.utc(value, DATE_FORMAT)

          if (value === undefined) {
            return begin.isValid()
              ? schema.oneOf(['XX:XX'], 'should be after start_at').required()
              : schema
          } else {
            if ((begin.isValid() && !end.isValid()) || !begin.isBefore(end)) {
              return schema.oneOf(['XX:XX'], 'should be after start_at').required()
            }
          }

          return schema
        }),
      slot_length: yup.number().oneOf([5, 10, 15, null]).nullable(true).notRequired(),
    })
}

module.exports = UpdateSlot
