'use strict'

const Mail = use('Mail')
const Config = use('Config')
const { trim } = require('lodash')
const l = use('Localize')

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const FromEmail = process.env.FROM_EMAIL
const LANDLORD_EMAIL_TEMPLATE = process.env.LANDLORD_EMAIL_TEMPLATE
const PROSPECT_EMAIL_TEMPLATE = process.env.PROSPECT_EMAIL_TEMPLATE

const { ROLE_LANDLORD, ROLE_USER } = require('../constants')
const HttpException = require('../Exceptions/HttpException')

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
  }

  static async sendWelcomeMail( email, {code, role, lang} ) {
    const templateId =
      role === ROLE_LANDLORD
        ? LANDLORD_EMAIL_TEMPLATE
        : PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: trim(email, ' '),
      from: FromEmail,
      templateId: templateId,
      dynamic_template_data: {
        subject: l.get('landlord.email_confirmation.subject.message', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        intro: l.get('landlord.email_confirmation.intro.message', lang),
        CTA: l.get('landlord.email_confirmation.CTA.message', lang),
        link: code,
        final: l.get('landlord.email_confirmation.final.message', lang),
        greeting: l.get('email_signature.greeting.message', lang),
        company: l.get('email_signature.company.message', lang),
        position: l.get('email_signature.position.message', lang),        
        tel: l.get('email_signature.tel.message', lang),
        email: l.get('email_signature.email.message', lang),
        address: l.get('email_signature.address.message', lang),
        website: l.get('email_signature.website.message', lang),
        tel_val: l.get('tel.customer_service.de.message', lang),
        email_val: l.get('email.customer_service.de.message', lang),
        address_val: l.get('address.customer_service.de.message', lang),
        website_val: l.get('website.customer_service.de.message', lang),
        team: l.get('email_signature.team.message', lang),
        download_app: l.get('email_signature.download.app.message', lang),
        enviromental_responsibility: l.get('email_signature.enviromental.responsibility.message', lang),
      },
    }

    return sgMail
    .send(msg)
    .then(() => {
      console.log('Welcome Email delivery successfully')
    }, error => {
      console.log('Welcome Email delivery failed', error);
        if (error.response) {
        console.error(error.response.body)
      }
    });    
  }
  static async sendcodeForgotPasswordMail(email, code, role, lang) {



    try {

      console.log('language__Lang1:', lang)
      // console.log('Localize__l1', l)
      console.log('subject__message1:',  l.get('landlord.email_reset.password.subject.message', lang))

      const templateId =
        role === ROLE_LANDLORD
          ? LANDLORD_EMAIL_TEMPLATE
          : PROSPECT_EMAIL_TEMPLATE

      console.log('templateId:', templateId)

      const msg = {
        to: trim(email),
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
          tel_val: l.get('tel.customer_service.de.message', lang),
          email_val: l.get('email.customer_service.de.message', lang),
          address_val: l.get('address.customer_service.de.message', lang),
          website_val: l.get('website.customer_service.de.message', lang),
          download_app: l.get('email_signature.download.app.message', lang),
          team: l.get('email_signature.team.message', lang),        
          enviromental_responsibility: l.get('email_signature.enviromental.responsibility.message', lang),
        },
      }

      return sgMail
      .send(msg)
      .then(() => {
        console.log('Reset Email delivery successfully')
      }, error => {
        console.log('Reset Email delivery failed', error);
          if (error.response) {
          console.error(error.response.body)
        }
      });
    } catch (e) {
      console.log('CATCH sendcodeForgotPasswordMail')
      console.log('e:', e)
    }
  }

  static async sendcodeForMemberInvitation(email, shortLink) {
    const msg = {
      to: email,
      from: FromEmail, // Use the email address or domain you verified above
      subject: `You got the link for invitation for your household`,
      text: `Here is the link is ${shortLink}`,
      html: `<h3> Code for invitation is is <b>${shortLink}</b></h3>`,
    }
console.log('SendCodeForMember Email', email )
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

  static async sendInvitationToTenant(email, shortLink) {
    const msg = {
      to: email,
      from: FromEmail, // Use the email address or domain you verified above
      subject: `Invitation to add your properties to this estate`,
      text: `Here is the link is ${shortLink}`,
      html: `<h3> Code for invitation is is <b>${shortLink}</b></h3>`,
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
  }

  static async sendInvitationToTenant(email, shortLink) {
    const msg = {
      to: email,
      from: FromEmail, // Use the email address or domain you verified above
      subject: `Invitation to add your properties to this estate`,
      text: `Here is the link is ${shortLink}`,
      html: `<h3> Code for invitation is is <b>${shortLink}</b></h3>`,
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
    const templateId =
      role === ROLE_LANDLORD
        ? LANDLORD_EMAIL_TEMPLATE
        : PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: trim(email),
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
  }

  /**
   *
   */
  static async sendUserConfirmation(email, { code, user_id, role, lang = 'de' }) {
    const templateId =
      role === ROLE_LANDLORD
        ? LANDLORD_EMAIL_TEMPLATE
        : PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: trim(email),
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
        tel_val: l.get('tel.customer_service.de.message', lang),
        email_val: l.get('email.customer_service.de.message', lang),
        address_val: l.get('address.customer_service.de.message', lang),
        website_val: l.get('website.customer_service.de.message', lang),
        team: l.get('email_signature.team.message', lang),
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
