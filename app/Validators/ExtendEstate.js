'use strict'

const yup = require('yup')
const Base = require('./Base')
const moment = require('moment')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, OPTION, INVALID_IDS, SIZE, NUMBER, SHOULD_BE_AFTER },
} = require('../exceptions')
const { DATE_FORMAT } = require('../constants')

class ExtendEstate extends Base {
  static schema = () =>
    yup.object().shape({
      available_end_at: yup
        .date()
        .min(new Date())
        .when(['available_start_at'], (available_start_at, schema, { value }) => {
          if (!available_start_at) return schema
          return value && value <= available_start_at
            ? yup
                .date()
                .min(
                  available_start_at,
                  getExceptionMessage(
                    'available_end_at',
                    SHOULD_BE_AFTER,
                    moment(available_start_at).format(DATE_FORMAT)
                  )
                )
            : schema
        })
        .required(),
    })
}

module.exports = ExtendEstate
