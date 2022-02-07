'use strict'

const Mail = use('Mail')
const Config = use('Config')

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const FromEmail = process.env.FROM_EMAIL

class MailService {
  static async sendResetPasswordMail(email, code) {

    const msg = {
      to: email,
      from: FromEmail, // Use the email address or domain you verified above
      subject: `Reset password`,
      text: `Reset password confirm code ${code}`,
      html: `<h3> Reset password confirm code <b>${ code }</b></h3>`,
    };

    return sgMail
    .send(msg)
    .then(() => {
      console.log('Email delivery successfully')
    }, error => {
      console.log('Email delivery failed', error);
        if (error.response) {
        console.error(error.response.body)
      }
    });

    // await Mail.send('mail/reset-password', { code }, (message) => {
    //   message.to(email).from(Config.get('mail.mailAccount')).subject('Reset password')
    // })
  }

  static async sendcodeForgotPasswordMail(email, code) {

    const msg = {
      to: email,
      from: FromEmail, // Use the email address or domain you verified above
      subject: `Code for forget password`,
      text: `Your code is ${code}`,
      html: `<h3> Your code is <b>${ code }</b></h3>`,
    };

    return sgMail
    .send(msg)
    .then(() => {
      console.log('Email delivery successfully')
    }, error => {
      console.log('Email delivery failed', error);
        if (error.response) {
        console.error(error.response.body)
      }
    });

    // await Mail.send('mail/send-code', { code }, (message) => {
    //   message.to(email).from(Config.get('mail.mailAccount')).subject('Code for forget password')
    // })
  }

  static async sendcodeForMemberInvitation(email, code) {

    const msg = {
      to: email,
      from: FromEmail, // Use the email address or domain you verified above
      subject: `Code for invitation is`,
      text: `Code for invitation is ${code}`,
      html: `<h3> Code for invitation is is <b>${ code }</b></h3>`,
    };

    return sgMail
    .send(msg)
    .then(() => {
      console.log('Email delivery successfully')
    }, error => {
      console.log('Email delivery failed', error);
        if (error.response) {
        console.error(error.response.body)
      }
    });

    // await Mail.send('mail/send-code', { code }, (message) => {
    //   message.to(email).from(Config.get('mail.mailAccount')).subject('Code for invitation code')
    // })
  }  

  static async sendChangeEmailConfirmation(email, code) {

    const msg = {
      to: email,
      from: FromEmail, // Use the email address or domain you verified above
      subject: `Confirm email`,
      text: `your email confirmation code ${code}`,
      html: `<h3> Your email confirmation link <a href="${process.env.APP_URL}/account/change_email?code=${code}&user_id=${user_id}">${ code }</a></h3>`,
    };

    return sgMail
    .send(msg)
    .then(() => {
      console.log('Email delivery successfully')
    }, error => {
      console.log('Email delivery failed', error);
        if (error.response) {
        console.error(error.response.body)
      }
    });

    // await Mail.send('mail/confirm-email', { code }, (message) => {
    //   message.to(email).from(Config.get('mail.mailAccount')).subject('Reset password')
    // })
  }

  /**
   *
   */
  static async sendUserConfirmation(email, { code, user_id }) {

    const msg = {
      to: email,
      from: FromEmail, // Use the email address or domain you verified above
      subject: `Confirm email`,
      text: `your email confirmation code  ${code}`,
      html: `<h3> Your email confirmation link <a href="${process.env.APP_URL}/account/change_email?code=${code}&user_id=${user_id}">${ code }</a></h3>`,
    };

    return sgMail
    .send(msg)
    .then(() => {
      console.log('Email delivery successfully')
    }, error => {
      console.log('Email delivery failed', error);
        if (error.response) {
        console.error(error.response.body)
      }
    });
  
    // return Mail.send('mail/confirm-email', { code, user_id }, (message) => {
    //   message.to(email).from(Config.get('mail.mailAccount')).subject('Confirm email')
    // })
  }
}

module.exports = MailService
