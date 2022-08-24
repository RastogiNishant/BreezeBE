'use strict'

const yup = require('yup')
const { TENANT_EMAIL_INVITE, TENANT_SMS_INVITE } = require('../constants')

const Base = require('./Base')

class InitTask extends Base {
  static schema = () =>
    yup.object().shape({
      predefined_message_id: yup.number().positive(),
      predefined_message_choice_id: yup.number().positive(),
      estate_id: yup.number().positive().required(),
      task_id: yup.number().nullable(),
      answer: yup.string(),
      title: yup.string(),
      attachments: yup.array().of(yup.string()).nullable(),
    })
}

module.exports = InitTask
