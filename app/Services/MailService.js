'use strict'

const { trim, capitalize } = require('lodash')
const l = use('Localize')
const moment = require('moment')
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const FromEmail = process.env.FROM_EMAIL
const OhneMaklerRecipientEmail = process.env.OHNE_MAKLER_RECIPIENT_EMAIL
const FROM_ONBOARD_EMAIL = process.env.FROM_ONBOARD_EMAIL
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL
const LANDLORD_EMAIL_TEMPLATE = process.env.LANDLORD_EMAIL_TEMPLATE
const PROSPECT_EMAIL_TEMPLATE = process.env.PROSPECT_EMAIL_TEMPLATE
const SITE_URL = process.env.SITE_URL
const INVITE_APP_LINK = process.env.INVITE_APP_LINK || 'https://linktr.ee/breeze.app'
const {
  ROLE_LANDLORD,
  ROLE_USER,
  DEFAULT_LANG,
  DAY_FORMAT,
  DATE_FORMAT,
  SEND_EMAIL_TO_OHNEMAKLER_SUBJECT,
  GERMAN_DATE_TIME_FORMAT,
} = require('../constants')
const HttpException = require('../Exceptions/HttpException')

class MailService {
  static async sendWelcomeMail(user, { code, role, lang, forgotLink = '' }) {
    const templateId = role === ROLE_LANDLORD ? LANDLORD_EMAIL_TEMPLATE : PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: trim(user.email, ' '),
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
        enviromental_responsibility: l.get(
          'email_signature.enviromental.responsibility.message',
          lang
        ),

        username: l.get('prospect.settings.user_details.txt_type_username', lang),
        username_val: user.email,
        forgot_link: forgotLink,
        password_forbidden: l.get('prospect.email_forgot.password.hidden.message', lang),
        forgot_label: l.get('prospect.email_forgot.password.subject.message', lang),
        forgot_prefix: l.get('prospect.email_forgot.password.intro.message', lang),
        forgot_link_txt: l.get('prospect.email_forgot.password.CTA.message', lang),
        forgot_suffix: l.get('prospect.email_forgot.password.final.message', lang),
      },
    }

    return sgMail.send(msg).then(
      () => {
        console.log('Welcome Email delivery successfully')
      },
      (error) => {
        console.log('Welcome Email delivery failed', error)
        if (error.response) {
          console.error(error.response.body)
        }
      }
    )
  }
  static async sendcodeForgotPasswordMail(email, code, role, lang = DEFAULT_LANG) {
    const templateId = role === ROLE_LANDLORD ? LANDLORD_EMAIL_TEMPLATE : PROSPECT_EMAIL_TEMPLATE

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
        enviromental_responsibility: l.get(
          'email_signature.enviromental.responsibility.message',
          lang
        ),
      },
    }

    return sgMail.send(msg).then(
      () => {
        console.log('Reset Email delivery successfully')
      },
      (error) => {
        console.log('Reset Email delivery failed', error)
        if (error.response) {
          console.error(error.response.body)
        }
      }
    )
  }

  static async sendcodeForMemberInvitation(email, shortLink, lang = DEFAULT_LANG) {
    const templateId = PROSPECT_EMAIL_TEMPLATE

    const intro = l
      .get('prospect.email_invite_hh_member.intro.message', lang)
      .replace(/\n/g, '<br />')
    const final = l
      .get('prospect.email_invite_hh_member.final.message', lang)
      .replace(/\n/g, '<br />')

    const msg = {
      to: trim(email),
      from: FromEmail,
      templateId: templateId,
      dynamic_template_data: {
        subject: l.get('prospect.email_invite_hh_member.subject.message', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        intro,
        link: shortLink,
        CTA: l.get('prospect.email_invite_hh_member.CTA.message', lang),
        final,
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
        enviromental_responsibility: l.get(
          'email_signature.enviromental.responsibility.message',
          lang
        ),
        username: l.get('prospect.settings.user_details.txt_type_username', lang),
        username_val: email,
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
      html: `<h3> Code for invitation is <b>${shortLink}</b></h3>`,
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

  static async sendChangeEmailConfirmation(email, code, role) {
    const templateId = role === ROLE_LANDLORD ? LANDLORD_EMAIL_TEMPLATE : PROSPECT_EMAIL_TEMPLATE

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
  static async sendUserConfirmation(
    email,
    { code, user, role, lang = DEFAULT_LANG, forgotLink = '' }
  ) {
    const templateId = role === ROLE_LANDLORD ? LANDLORD_EMAIL_TEMPLATE : PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: trim(email),
      from: FromEmail,
      templateId: templateId,
      dynamic_template_data: {
        subject: l.get('landlord.email_verification.subject.message', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        intro: l.get('landlord.email_verification.intro.message', lang),
        code: l.get('email_signature.code.message', lang),
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
        enviromental_responsibility: l.get(
          'email_signature.enviromental.responsibility.message',
          lang
        ),
        display: 'none',

        username: l.get('prospect.settings.user_details.txt_type_username', lang),
        username_val: user.email,
        forgot_link: forgotLink,
        password_forbidden: l.get('prospect.email_forgot.password.hidden.message', lang),
        forgot_label: l.get('prospect.email_forgot.password.subject.message', lang),
        forgot_prefix: l.get('prospect.email_forgot.password.intro.message', lang),
        forgot_link_txt: l.get('prospect.email_forgot.password.CTA.message', lang),
        forgot_suffix: l.get('prospect.email_forgot.password.final.message', lang),
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
          throw new HttpException(error.response.body)
        } else {
          throw new HttpException(error)
        }
      }
    )
  }

  /**
   *
   */
  static async sendLandlordActivateEmail(email, { user, lang = DEFAULT_LANG }) {
    const templateId = LANDLORD_EMAIL_TEMPLATE

    const msg = {
      to: trim(email),
      from: FromEmail,
      templateId: templateId,
      dynamic_template_data: {
        subject: l.get('landlord.email_account_activation.subject.message', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        intro: l.get('landlord.email_account_activation.intro.message', lang),
        CTA: l.get('landlord.email_account_activation.CTA.message', lang),
        link: SITE_URL,
        final: l.get('landlord.email_account_activation.final.message', lang),
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
        enviromental_responsibility: l.get(
          'email_signature.enviromental.responsibility.message',
          lang
        ),
        username: l.get('prospect.settings.user_details.txt_type_username', lang),
        username_val: user.email,
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
          throw new HttpException(error.response.body)
        } else {
          throw new HttpException(error)
        }
      }
    )
  }

  async sendInviteToViewEstate(values) {
    /*
    const templateId = TO_OFF_MARKET_VIEW_ESTATE_EMAIL_TEMPLATE;
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
    }*/
    const msg = {
      to: values.email,
      from: FromEmail, // Use the email address or domain you verified above
      subject: `You are invited to view this ${values.code}`,
      text: `Invited to view this Estate: ${values.code}`,
      html: `<h3> code: <b>${values.code}</b></h3>`,
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

  static async sendUnverifiedLandlordActivationEmailToAdmin(txt) {
    const subject = `New landlord is adding property`
    const msg = {
      to: ADMIN_NOTIFY_EMAIL,
      from: FROM_ONBOARD_EMAIL, // Use the email address or domain you verified above
      subject: subject,
      text: txt,
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

  static async inviteEmailToProspect({ email, address, lang = DEFAULT_LANG }) {
    const templateId = PROSPECT_EMAIL_TEMPLATE

    const intro = l
      .get('prospect.email_visit_invitation.intro.message', lang)
      .replace(/\[[a-z1-9\s]+\]/, `<strong>${address.replace(/\w+/g, capitalize)}</strong>`)
      .replace(/\n/g, '<br />')
    const final = l
      .get('prospect.email_visit_invitation.final.message', lang)
      .replace(/\n/g, '<br />')
    const msg = {
      to: trim(email),
      from: FromEmail,
      templateId: templateId,
      dynamic_template_data: {
        subject: l.get('prospect.email_visit_invitation.subject.message', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        intro: intro,
        final: final,
        CTA: l.get('prospect.email_visit_invitation.CTA.message', lang),
        link: INVITE_APP_LINK,
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
        enviromental_responsibility: l.get(
          'email_signature.enviromental.responsibility.message',
          lang
        ),
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
          throw new HttpException(error.response.body)
        } else {
          throw new HttpException(error)
        }
      }
    )
  }

  static async notifyVisitEmailToProspect({ email, address, lang = DEFAULT_LANG }) {
    const templateId = PROSPECT_EMAIL_TEMPLATE

    const intro = l
      .get('prospect.email_day_of_visit_reminder.intro.message', lang)
      .replace(/\[[a-z1-9\s]+\]/, `<strong>${address.replace(/\w+/g, capitalize)}</strong>`)
      .replace(/\n/g, '<br />')

    const final = l
      .get('prospect.email_day_of_visit_reminder.final.message', lang)
      .replace(/\n/g, '<br />')

    const msg = {
      to: trim(email),
      from: FromEmail,
      templateId: templateId,
      dynamic_template_data: {
        subject: l.get('prospect.email_day_of_visit_reminder.subject.message', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        intro: intro,
        CTA: l.get('prospect.email_day_of_visit_reminder.CTA.message', lang),
        link: INVITE_APP_LINK,
        final: final,
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
        enviromental_responsibility: l.get(
          'email_signature.enviromental.responsibility.message',
          lang
        ),
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
          throw new HttpException(error.response.body)
        } else {
          throw new HttpException(error)
        }
      }
    )
  }

  static async sendInvitationToOusideTenant(links, lang = DEFAULT_LANG) {
    const templateId = PROSPECT_EMAIL_TEMPLATE
    const messages = links.map((link) => {
      return {
        to: trim(link.email),
        from: FromEmail,
        templateId: templateId,
        dynamic_template_data: {
          subject: l.get('tenant.email_landlord_invitation.subject.message', lang),
          salutation: l.get('email_signature.salutation.message', lang),
          intro: l.get('tenant.email_landlord_invitation.intro.message', lang),
          CTA: l.get('tenant.email_landlord_invitation.CTA.message', lang),
          link: link.shortLink,
          final: l.get('tenant.email_landlord_invitation.final.message', lang),
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
          enviromental_responsibility: l.get(
            'email_signature.enviromental.responsibility.message',
            lang
          ),
        },
      }
    })

    return sgMail.send(messages).then(
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

  static async inviteLandlordFromTenant({ task, link, lang = DEFAULT_LANG }) {
    const templateId = LANDLORD_EMAIL_TEMPLATE

    const shortMsg = `${task.property_address}, ${task.address_detail}: \n 
                      ${l.get(task.title, lang)}:${l.get(task.description, lang)} ... ${moment
      .utc(task.created_at)
      .format(DATE_FORMAT)}`

    const intro = l
      .get('landlord.email_connect_invitation.intro.message', lang)
      .replace('{{email}}', task.email)
      .replace('{{short_message}}', shortMsg)
      .replace(/\n/g, '<br />')
    const final = l
      .get('landlord.email_connect_invitation.final.message', lang)
      .replace(/\n/g, '<br />')
    const msg = {
      to: trim(task.email),
      from: FromEmail,
      templateId: templateId,
      dynamic_template_data: {
        subject: l.get('landlord.email_connect_invitation.subject.message', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        intro: intro,
        final: final,
        CTA: l.get('landlord.email_connect_invitation.CTA.message', lang),
        link: link,
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
        enviromental_responsibility: l.get(
          'email_signature.enviromental.responsibility.message',
          lang
        ),
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
          throw new HttpException(error.response.body)
        } else {
          throw new HttpException(error)
        }
      }
    )
  }

  static async sendEmailToSupport({ subject, textMessage, htmlMessage }) {
    const msg = {
      to: FromEmail,
      from: FromEmail, // Use the email address or domain you verified above
      subject: subject,
      text: textMessage,
      html: htmlMessage,
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

  static async sendEmailToOhneMakler(textMessage, recipient) {
    const msg = {
      to: recipient,
      from: FromEmail, // Use the email address or domain you verified above
      subject: SEND_EMAIL_TO_OHNEMAKLER_SUBJECT + moment().format(GERMAN_DATE_TIME_FORMAT),
      text: textMessage,
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

  static async sendToSupportLandlordPublishedOneEstate({ landlord }) {}

  static async sendToSupportLandlordConnectedOneEstate() {}
}

module.exports = MailService
