'use strict'
const HttpException = use('App/Exceptions/HttpException')

const Twilio = use('Twilio')
const Env = use('Env')
const l = use('Localize')

class SMS {
  static async send(to, code, lang = 'en') {
    try {
      const body = l.get('landlord.email_verification.subject.message', lang) + ` ${code}`
      const message = await Twilio.messages.create({
        body: body,
        from: Env.get('TWILIO_FROM', ''),
        to: to,
      })
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = SMS
