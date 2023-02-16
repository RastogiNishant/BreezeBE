'use strict'

const moment = require('moment')
const yup = require('yup')
const Base = require('./Base')
const { DATE_FORMAT } = require('../constants')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, OPTION, STRING, SHOULD_BE_AFTER },
} = require('../exceptions')

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
      start_at: yup
        .string()
        .transform(transformTime)
        .required(getExceptionMessage('start_at', REQUIRED))
        .typeError(getExceptionMessage('start_at', STRING)),
      end_at: yup
        .string()
        .transform(transformTime)
        .when('start_at', (startAt, schema, { value }) => {
          const begin = moment.utc(startAt, DATE_FORMAT)
          const end = moment.utc(value, DATE_FORMAT)

          if (value === undefined) {
            return begin.isValid()
              ? schema
                  .oneOf(['XX:XX'], getExceptionMessage('end_at', SHOULD_BE_AFTER, 'start_at'))
                  .required(getExceptionMessage('end_at', REQUIRED))
              : schema
          } else {
            if ((begin.isValid() && !end.isValid()) || !begin.isBefore(end)) {
              return schema
                .oneOf(['XX:XX'], getExceptionMessage('end_at', SHOULD_BE_AFTER, 'start_at'))
                .required(getExceptionMessage('end_at', REQUIRED))
            }
          }

          return schema
        })
        .typeError(getExceptionMessage('end_at', STRING)),
      slot_length: yup
        .number()
        .oneOf([5, 10, 15, null], getExceptionMessage('slot_length', OPTION, `[5,10,15,null]`))
        .nullable(true)
        .notRequired(),
    })
}

module.exports = UpdateSlot
