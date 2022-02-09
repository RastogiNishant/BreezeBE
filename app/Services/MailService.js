'use strict'

const Mail = use('Mail')
const Config = use('Config')

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const FromEmail = process.env.FROM_EMAIL
const {
  ROLE_LANDLORD, ROLE_USER
} = require('../constants')
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

  static async sendcodeForgotPasswordMail(email, code, role) {

    // const msg = {
    //   to: email,
    //   from: FromEmail, // Use the email address or domain you verified above
    //   subject: `Code for forget password`,
    //   text: `Your code is ${code}`,
    //   html: `<h3> Your code is <b>${ code }</b></h3>`,
    // };

    // return sgMail
    // .send(msg)
    // .then(() => {
    //   console.log('Email delivery successfully')
    // }, error => {
    //   console.log('Email delivery failed', error);
    //     if (error.response) {
    //     console.error(error.response.body)
    //   }
    // });

    const templateId = role === ROLE_LANDLORD?`d-eac817b4c5934599b956fc07d0dfac5e`:`d-87fde342eaf3493485bddb1823f50ca3`
    const msg = {
      to: email,
      from: FromEmail,
      templateId: templateId,
      dynamic_template_data: {
        subject:'Forgot password',
        link: `${code}`,
      },
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

  static async sendChangeEmailConfirmation(email, code, role) {

    // const msg = {
    //   to: email,
    //   from: FromEmail, // Use the email address or domain you verified above
    //   subject: `Confirm email`,
    //   text: `your email confirmation code ${code}`,
    //   html: `<h3> Your email confirmation link <a href="${process.env.APP_URL}/account/change_email?code=${code}&user_id=${user_id}">${ code }</a></h3>`,
    // };

    const templateId = role === ROLE_LANDLORD?`d-eac817b4c5934599b956fc07d0dfac5e`:`d-87fde342eaf3493485bddb1823f50ca3`
    const msg = {
      to: email,
      from: FromEmail,
      templateId: templateId,
      dynamic_template_data: {
        subject:'Confirm your email',
        link: `${process.env.APP_URL}/account/change_email?code=${code}&user_id=${user_id}`,
      },
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
  static async sendUserConfirmation(email, { code, user_id, role }) {

    // const msg = {
    //   to: email,
    //   from: FromEmail, // Use the email address or domain you verified above
    //   subject: `Confirm email`,
    //   text: `your email confirmation code  ${code}`,
    //   html: `<h3> Your email confirmation link <a href="${process.env.APP_URL}/account/change_email?code=${code}&user_id=${user_id}">${ code }</a></h3>`,
    // };

    const templateId = role === ROLE_LANDLORD?`d-eac817b4c5934599b956fc07d0dfac5e`:`d-87fde342eaf3493485bddb1823f50ca3`

    const msg = {
      to: email,
      from: FromEmail,
      templateId: templateId,
      dynamic_template_data: {
        subject:'Confirm your email',
        link: `${process.env.APP_URL}/account/change_email?code=${code}&user_id=${user_id}`,
      },
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
