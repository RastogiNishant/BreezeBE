'use strict'

const Twilio = use('Twilio');
const Config = use('Config')
const Env = use('Env')

class SMS {
    static async send ( to, code ) {
        const message = await Twilio.messages.create({
            body: `Your invitation code is ${code}`,
            from: Env.get('TWILIO_FROM', ''),
            to: to
        });
    }
}

module.exports = SMS