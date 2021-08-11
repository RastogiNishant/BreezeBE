'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  NOTICE_TYPE_LANDLORD_FILL_PROFILE,
  NOTICE_TYPE_LANDLORD_NEW_PROPERTY,
  NOTICE_TYPE_LANDLORD_TIME_FINISHED,
  NOTICE_TYPE_LANDLORD_CONFIRM_VISIT,
  NOTICE_TYPE_LANDLORD_VISIT30M,
  NOTICE_TYPE_LANDLORD_MATCH,
  NOTICE_TYPE_LANDLORD_DECISION,
  NOTICE_TYPE_PROSPECT_NEW_MATCH,
  NOTICE_TYPE_PROSPECT_MATCH_LEFT,
  NOTICE_TYPE_PROSPECT_INVITE,
  NOTICE_TYPE_PROSPECT_VISIT3H,
  NOTICE_TYPE_PROSPECT_VISIT30M,
  NOTICE_TYPE_PROSPECT_COMMIT,
  NOTICE_TYPE_PROSPECT_REJECT,
  NOTICE_TYPE_PROSPECT_NO_ACTIVITY,
  NOTICE_TYPE_PROSPECT_VISIT90M,
  NOTICE_TYPE_LANDLORD_VISIT90M,
  NOTICE_TYPE_PROSPECT_PROFILE_EXPIRE,
} = require('../constants')

class DebugNotification extends Base {
  static options = {
    abortEarly: false,
    stripUnknown: false,
  }

  static schema = () =>
    yup.object().shape({
      type: yup
        .string()
        .required()
        .oneOf([
          NOTICE_TYPE_LANDLORD_FILL_PROFILE,
          NOTICE_TYPE_LANDLORD_NEW_PROPERTY,
          NOTICE_TYPE_LANDLORD_TIME_FINISHED,
          NOTICE_TYPE_LANDLORD_CONFIRM_VISIT,
          NOTICE_TYPE_LANDLORD_VISIT30M,
          NOTICE_TYPE_LANDLORD_MATCH,
          NOTICE_TYPE_LANDLORD_DECISION,
          NOTICE_TYPE_PROSPECT_NEW_MATCH,
          NOTICE_TYPE_PROSPECT_MATCH_LEFT,
          NOTICE_TYPE_PROSPECT_INVITE,
          NOTICE_TYPE_PROSPECT_VISIT3H,
          NOTICE_TYPE_PROSPECT_VISIT30M,
          NOTICE_TYPE_PROSPECT_COMMIT,
          NOTICE_TYPE_PROSPECT_REJECT,
          NOTICE_TYPE_PROSPECT_NO_ACTIVITY,
          NOTICE_TYPE_PROSPECT_VISIT90M,
          NOTICE_TYPE_LANDLORD_VISIT90M,
          NOTICE_TYPE_PROSPECT_PROFILE_EXPIRE,
        ]),
      estate_id: yup.number().integer().positive().required(),
      data: yup.object(),
    })
}

module.exports = DebugNotification