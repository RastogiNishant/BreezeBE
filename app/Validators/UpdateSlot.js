'use strict'

const moment = require('moment')
const yup = require('yup')
const Base = require('./Base')
const { DATE_FORMAT } = require('../constants')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, OPTION, STRING, SHOULD_BE_AFTER }
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
      is_not_show: yup.boolean(),
      start_at: yup
        .string()
        .transform(transformTime)
        .when('is_not_show', (is_not_show, schema, { value }) => {
          if (!is_not_show) {
            return schema.required(getExceptionMessage('start_at', REQUIRED))
          }
          return schema
        })
        .typeError(getExceptionMessage('start_at', STRING)),
      end_at: yup
        .string()
        .transform(transformTime)
        .when(['is_not_show', 'start_at'], (is_not_show, startAt, schema, { value }) => {
          if (is_not_show && !value) {
            return schema
          }

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
        .notRequired()
    })
}

module.exports = UpdateSlot
