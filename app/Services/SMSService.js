'use strict'
const HttpException = use('App/Exceptions/HttpException')

const Twilio = use('Twilio')
const Env = use('Env')
const l = use('Localize')

class SMS {
  static async send({ to, txt }) {
    try {
      await Twilio.messages.create({
        body: txt,
        from: Env.get('TWILIO_FROM', ''),
        to: to,
      })
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = SMS
