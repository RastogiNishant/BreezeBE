'use strict'

//const Twilio = use('Twilio');
const Env = use('Env')

class SMS {
  static async send ( to, code ) {
    // try{
    //     const message = await Twilio.messages.create({
    //         body: `Your invitation code is ${code}`,
    //         from: Env.get('TWILIO_FROM', ''),
    //         to: to
    //     });
    // }catch(e){
    //   throw new HttpException(e.message, 400)      
    // }
  }
}

module.exports = SMS