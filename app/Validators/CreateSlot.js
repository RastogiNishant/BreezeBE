'use strict'

const moment = require('moment')
const yup = require('yup')
const Base = require('./Base')

const transformTime = (value) => {
  const date = moment.utc(value, 'HH:mm')
  if (!date.isValid()) {
    return null
  }

  return date.format('HH:mm')
}

class CreateSlot extends Base {
  static schema = () =>
    yup.object().shape({
      week_day: yup.number().integer().min(1).max(7), // week day by moment [1...7] monday first
      start_at: yup.string().transform(transformTime),
      end_at: yup
        .string()
        .transform(transformTime)
        .when('start_at', (startAt, schema, { value }) => {
          const begin = moment.utc(startAt, 'HH:mm')
          const end = moment.utc(value, 'HH:mm')
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
      slot_length: yup.number().oneOf([5, 10, 15]),
    })
}

module.exports = CreateSlot
