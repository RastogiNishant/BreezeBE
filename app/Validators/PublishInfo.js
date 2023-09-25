'use strict'

const yup = require('yup')
const Base = require('./Base')
const moment = require('moment')
const { DATE_FORMAT } = require('../constants')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, OPTION, INVALID_IDS, SIZE, NUMBER, SHOULD_BE_AFTER },
} = require('../exceptions')
class PublishInfo extends Base {
  static schema = () =>
    yup.object().shape({
      available_start_at: yup.date().nullable(),
      available_end_at: yup
        .date()
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
        .nullable(),
      is_duration_later: yup.boolean(),
      min_invite_count: yup
        .number()
        .integer()
        .when('is_duration_later', {
          is: true,
          then: yup
            .number()
            .integer()
            .positive()
            .required()
            .typeError(getExceptionMessage('min_invite_count', NUMBER)),
        }),
      notify_on_green_matches: yup.boolean().nullable(),
    })
}

module.exports = PublishInfo
