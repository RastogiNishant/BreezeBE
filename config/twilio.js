'use strict'

const Env = use('Env')

module.exports = {
  TWILIO_ACCOUNT_SID: Env.get('TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN: Env.get('TWILIO_AUTH_TOKEN'),
  TWILIO_FROM: Env.get('TWILIO_FROM'),
  SMS_DISABLED: Env.get('SMS_DISABLED'),
}
