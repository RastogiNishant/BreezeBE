'use strict'

const Mail = use('Mail')
const Config = use('Config')
const l = use('Localize')

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const FromEmail = process.env.FROM_EMAIL
const LANDLORD_EMAIL_TEMPLATE = process.env.LANDLORD_EMAIL_TEMPLATE
const PROSPECT_EMAIL_TEMPLATE = process.env.PROSPECT_EMAIL_TEMPLATE

const { ROLE_LANDLORD, ROLE_USER } = require('../constants')

class MailService {
  static async sendResetPasswordMail(email, code) {
    const msg = {
      to: email,
      from: FromEmail, // Use the email address or domain you verified above
      subject: `Reset password`,
      text: `Reset password confirm code ${code}`,
      html: `<h3> Reset password confirm code <b>${code}</b></h3>`,
    }

    return sgMail.send(msg).then(
      () => {
        console.log('Email delivery successfully')
      },
      (error) => {
        console.log('Email delivery failed', error)
        if (error.response) {
          console.error(error.response.body)
        }
      }
    )

    // await Mail.send('mail/reset-password', { code }, (message) => {
    //   message.to(email).from(Config.get('mail.mailAccount')).subject('Reset password')
    // })
  }

  static async sendWelcomeMail( email, {link, role, lang} ) {
    const templateId =
      role === ROLE_LANDLORD
        ? LANDLORD_EMAIL_TEMPLATE
        : PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: email,
      from: FromEmail,
      templateId: templateId,
      dynamic_template_data: {
        subject: l.get('landlord.email_activation.subject.message', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        intro: l.get('landlord.email_activation.intro.message', lang),
        CTA: l.get('landlord.email_activation.CTA.message', lang),
        link: link,
        final: l.get('landlord.email_activation.final.message', lang),
        greeting: l.get('email_signature.greeting.message', lang),
        company: l.get('email_signature.company.message', lang),
        position: l.get('email_signature.position.message', lang),        
        tel: l.get('email_signature.tel.message', lang),
        email: l.get('email_signature.email.message', lang),
        address: l.get('email_signature.address.message', lang),
        website: l.get('email_signature.website.message', lang),
        download_app: l.get('email_signature.download.app.message', lang),
        enviromental_responsibility: l.get('email_signature.enviromental.responsibility.message', lang),
      },
    }

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
  }
  static async sendcodeForgotPasswordMail(email, code, role, lang) {
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
    // await Mail.send('mail/send-code', { code }, (message) => {
    //   message.to(email).from(Config.get('mail.mailAccount')).subject('Code for forget password')
    // })

    const templateId =
      role === ROLE_LANDLORD
        ? LANDLORD_EMAIL_TEMPLATE
        : PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: email,
      from: FromEmail, 
      templateId: templateId,
      dynamic_template_data: {
        subject: l.get('landlord.email_reset.password.subject.message', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        intro: l.get('landlord.email_reset.password.intro.message', lang),
        CTA: l.get('landlord.email_reset.password.CTA.message', lang),
        link: code,        
        final: l.get('landlord.email_reset.password.final.message', lang),
        greeting: l.get('email_signature.greeting.message', lang),
        company: l.get('email_signature.company.message', lang),
        position: l.get('email_signature.position.message', lang),        
        tel: l.get('email_signature.tel.message', lang),
        email: l.get('email_signature.email.message', lang),
        address: l.get('email_signature.address.message', lang),
        website: l.get('email_signature.website.message', lang),
        download_app: l.get('email_signature.download.app.message', lang),
        enviromental_responsibility: l.get('email_signature.enviromental.responsibility.message', lang),
      },
    }

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
  }

  static async sendcodeForMemberInvitation(email, code) {
    const msg = {
      to: email,
      from: FromEmail, // Use the email address or domain you verified above
      subject: `Code for invitation is`,
      text: `Code for invitation is ${code}`,
      html: `<h3> Code for invitation is is <b>${code}</b></h3>`,
    }

    return sgMail.send(msg).then(
      () => {
        console.log('Email delivery successfully')
      },
      (error) => {
        console.log('Email delivery failed', error)
        if (error.response) {
          console.error(error.response.body)
        }
      }
    )

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

    const templateId =
      role === ROLE_LANDLORD
        ? LANDLORD_EMAIL_TEMPLATE
        : PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: email,
      from: FromEmail,
      templateId: templateId,
      dynamic_template_data: {
        subject: 'Confirm your email',
        link: `${process.env.APP_URL}/account/change_email?code=${code}&user_id=${user_id}`,
      },
    }

    return sgMail.send(msg).then(
      () => {
        console.log('Email delivery successfully')
      },
      (error) => {
        console.log('Email delivery failed', error)
        if (error.response) {
          console.error(error.response.body)
        }
      }
    )

    // await Mail.send('mail/confirm-email', { code }, (message) => {
    //   message.to(email).from(Config.get('mail.mailAccount')).subject('Reset password')
    // })
  }

  /**
   *
   */
  static async sendUserConfirmation(email, { code, user_id, role, lang = 'de' }) {
  // const msg = {
  //   to: email,
  //   from: FromEmail, // Use the email address or domain you verified above
  //   subject: `Confirm email`,
  //   text: `your email confirmation code  ${code}`,
  //   html: `<h3> Your email confirmation link <a href="${process.env.APP_URL}/account/change_email?code=${code}&user_id=${user_id}">${ code }</a></h3>`,
  // };
// return Mail.send('mail/confirm-email', { code, user_id }, (message) => {
//   message.to(email).from(Config.get('mail.mailAccount')).subject('Confirm email')
// })

    const templateId =
      role === ROLE_LANDLORD
        ? LANDLORD_EMAIL_TEMPLATE
        : PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: email,
      from: FromEmail,
      templateId: templateId,
      dynamic_template_data: {
        subject: l.get('landlord.email_verification.subject.message', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        intro: l.get('landlord.email_verification.intro.message', lang),
        code:l.get('email_signature.code.message', lang),
        code_val: code,        
        final: l.get('landlord.email_verification.final.message', lang),
        greeting: l.get('email_signature.greeting.message', lang),
        company: l.get('email_signature.company.message', lang),
        position: l.get('email_signature.position.message', lang),        
        tel: l.get('email_signature.tel.message', lang),
        email: l.get('email_signature.email.message', lang),
        address: l.get('email_signature.address.message', lang),
        website: l.get('email_signature.website.message', lang),
        download_app: l.get('email_signature.download.app.message', lang),
        enviromental_responsibility: l.get('email_signature.enviromental.responsibility.message', lang),
        display:'none',

      },
    }

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
  }
}

module.exports = MailService
