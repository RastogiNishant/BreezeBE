'use strict'

const { trim, capitalize, startCase } = require('lodash')
const l = use('Localize')
const moment = require('moment')
const { generateAddress, parseFloorDirection } = use('App/Libs/utils')
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const FromEmail = process.env.FROM_EMAIL
const FromName = process.env.FROM_NAME || `Breeze Team`
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
  ESTATE_FLOOR_DIRECTION_RIGHT,
  ESTATE_FLOOR_DIRECTION_LEFT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT_LEFT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT_RIGHT,
  ESTATE_NO_IMAGE_COVER_URL,
  MARKETPLACE_LIST,
} = require('../constants')
const HttpException = require('../Exceptions/HttpException')
const Logger = use('Logger')
const { createDynamicLink } = require('../Libs/utils')

class MailService {
  static async sendWelcomeMail(user, { code, role, lang, forgotLink = '' }) {
    const templateId = role === ROLE_LANDLORD ? LANDLORD_EMAIL_TEMPLATE : PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: trim(user.email, ' '),
      from: {
        email: FromEmail,
        name: FromName,
      },
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
      from: {
        email: FromEmail,
        name: FromName,
      },
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
      from: {
        email: FromEmail,
        name: FromName,
      },
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
      from: {
        // Use the email address or domain you verified above
        email: FromEmail,
        name: FromName,
      },

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
      from: {
        email: FromEmail,
        name: FromName,
      },
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
      from: {
        email: FromEmail,
        name: FromName,
      },
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
        Logger.error(
          `Email Confirmation failed ${email}= ${error?.response?.body || error?.message || error}`
        )
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
      from: {
        email: FromEmail,
        name: FromName,
      },
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
    const msg = {
      to: values.email,
      from: {
        email: FromEmail,
        name: FromName,
      },
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
      from: {
        email: FromEmail,
        name: FromName,
      },
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
      from: {
        email: FromEmail,
        name: FromName,
      },
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

  static async sendInvitationToOusideTenant(links) {
    const templateId = PROSPECT_EMAIL_TEMPLATE
    const messages = links.map((link) => {
      const lang = link?.lang || DEFAULT_LANG
      return {
        to: trim(link.email),
        from: {
          email: FromEmail,
          name: FromName,
        },
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

  static async inviteLandlordFromTenant({ prospect_email, task, link, lang = DEFAULT_LANG }) {
    const templateId = LANDLORD_EMAIL_TEMPLATE

    const address = generateAddress({
      street: task?.property_address?.street,
      house_number: task?.property_address?.house_number,
      zip: task?.property_address?.postcode,
      city: task?.property_address?.city,
      country: task?.property_address?.country,
    })
    const shortMsg = `<b>${task.address_detail || ``}, ${address}</b>: \n 
                      <b>${l.get(task.title, lang)}</b>:<br/>${
      l.get(task.description, lang) || ``
    } `

    const intro = l
      .get('landlord.email_connect_invitation.intro.message', lang)
      .replace('{{email}}', `<b>${prospect_email}</b>`)
      .replace('{{short_message}}', shortMsg)
      .replace(/\n/g, '<br />')
    const final = l
      .get('landlord.email_connect_invitation.final.message', lang)
      .replace(/\n/g, '<br />')
    const msg = {
      to: trim(task.email),
      from: {
        email: FromEmail,
        name: FromName,
      },
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

  static async estatePublishRequestApproved(estate) {
    const lang = estate.lang || DEFAULT_LANG
    const templateId = LANDLORD_EMAIL_TEMPLATE
    const address = generateAddress({
      street: estate?.street,
      house_number: estate?.house_number,
      zip: estate?.postcode,
      city: estate?.city,
      country: estate?.country,
    })
    const intro = l
      .get('landlord.email_property_published.intro.message', lang)
      .replace('{{property_address}}', trim(startCase(address), ','))
      .replace('{{floor}}', estate.floor)
      .replace(
        '{{direction}}',
        estate.direction > 1 ? l.get(parseFloorDirection(estate.direction), lang) : ''
      )
      .replace(/\n/g, '<br />')

    const shortLink = await createDynamicLink(
      `${process.env.DEEP_LINK}?type=PUBLISHING_APPROVED&estate_id=${estate.estate_id}&email=${estate.email}&hash=${estate.hash}`,
      `${process.env.SITE_URL}/connect?type=PUBLISHING_APPROVED&tab=0&estate_id=${estate.estate_id}&email=${estate.email}`
    )
    const msg = {
      to: trim(estate.email),
      from: {
        email: FromEmail,
        name: FromName,
      },
      templateId: templateId,
      dynamic_template_data: {
        subject: l.get('landlord.email_property_published.subject.message', lang),
        salutation: '',
        intro: intro,
        final: '',
        CTA: l.get('landlord.email_property_published.CTA.message', lang),
        link: shortLink,
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

  static async sendEmailToSupport({ subject, textMessage, htmlMessage = '' }) {
    let msg = {
      to: FromEmail,
      from: {
        email: FromEmail,
        name: FromName,
      },
      subject: subject,
      text: textMessage,
    }

    if (htmlMessage) {
      msg.html = htmlMessage
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

  static async sendEmailToOhneMakler(textMessage, recipient, sendToBCC = false) {
    let msg = {
      to: recipient,
      from: {
        email: FromEmail,
        name: FromName,
      },
      subject:
        SEND_EMAIL_TO_OHNEMAKLER_SUBJECT +
        moment.utc().add(2, 'hours').format(GERMAN_DATE_TIME_FORMAT),
      text: textMessage,
    }
    if (sendToBCC) {
      msg.bcc = [sendToBCC]
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

  static async sendEmailWithAttachment({
    textMessage,
    recipient,
    bcc = null,
    subject,
    attachment,
    from,
  }) {
    const message = {
      to: recipient,
      from,
      subject: subject,
      text: textMessage,
      attachments: [
        {
          content: attachment,
          filename: 'Anfrage.xml',
          type: 'application/xml',
          disposition: 'attachment',
          content_id: 'breeze-attachment',
        },
      ],
    }
    if (bcc) {
      message.bcc = bcc
    }
    return sgMail.send(message).then(
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

  static getEmailAddressFormatter(estate, lang) {
    const formatter = new Intl.NumberFormat('de-DE')
    let floor =
      (estate.floor ? `${estate.floor}.` : '') +
      l.get(
        estate.floor
          ? 'landlord.portfolio.card.txt_floor.message'
          : 'prospect.property.preferences.apartment.txt_ground.message',
        lang
      )
    let address = `${formatter.format(estate.rooms_number)}${l.get(
      'pm.connect.task.txt_room_short.message',
      lang
    )}, ${formatter.format(estate.area)}㎡, ${floor} <br/>€${formatter.format(
      estate.net_rent || 0
    )}`

    address += `<br/>`

    const street = startCase(estate?.street || '')

    const city = startCase(estate?.city || '')

    const country = startCase(estate?.country || '')

    address += `<br/>`
    address += `${street} ${estate?.house_number || ''},<br/> ${
      estate?.zip || ''
    } ${city}, <br/> ${country}`

    const coverImage = `<table width='100%'><tr><td><img style = "width:100%; height:150px; border-radius: 5%" src = '${
      estate.cover ? estate.cover : ESTATE_NO_IMAGE_COVER_URL
    }'/></td></tr></table>`
    const addressLayout = `<tr><td>
      <table align="left" border="0" cellpadding="0" cellspacing="0" width = '100%'>
        <tr valign="top">
          <td align = "left" width = '150px' >${coverImage}</td>
          <td style = "padding-left:10px;">${address}</td>
        </tr>
      </table></td></tr>`

    return addressLayout
  }

  static async reminderKnockSignUpEmail({ link, email, estate, lang = DEFAULT_LANG }) {
    try {
      const templateId = PROSPECT_EMAIL_TEMPLATE
      const final = l
        .get('prospect.no_reply_email_to_complete_profile.final.message', lang)
        // .replace('{Landlord_name}', `${landlord_name}`)
        .replace(/\n/g, '<br />')

      let intro = l
        .get('prospect.no_reply_email_to_complete_profile.intro.message', lang)
        .replace('{Full_property_address}', this.getEmailAddressFormatter(estate, lang))

      const introLayout = `<table align="left" border="0" cellpadding="0" cellspacing="0" width = '100%'>
        <tr>${intro}</tr>
       </table>`

      const messages = {
        to: trim(email),
        from: {
          email: FromEmail,
          name: FromName,
        },
        templateId: templateId,
        dynamic_template_data: {
          subject: l.get('prospect.no_reply_email_to_complete_profile.subject.message', lang),
          salutation: l.get('email_signature.outside_salutation.message', lang),
          intro: introLayout,
          CTA: l.get('prospect.no_reply_email_to_complete_profile.CTA.message', lang),
          link,
          final,
          logo_shown: 'none',
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
    } catch (e) {
      Logger.error(`reminderKnockSignUpEmail ${email} ${e?.message}`)
    }
  }

  static async sendPendingKnockEmail({ link, contact, estate, lang = DEFAULT_LANG }) {
    try {
      const email = contact.email
      let publisher = MARKETPLACE_LIST?.[contact?.publisher]
      publisher = publisher ? l.get(publisher) : ''
      const templateId = PROSPECT_EMAIL_TEMPLATE

      const subject = l
        .get('prospect.no_reply_email_from_listing_updated.subject.message', lang)
        .replace('{{partner_name}}', publisher)

      let prospectName = l.get('prospect.settings.menu.txt_prospect.message', lang)
      if (contact?.contact_info?.firstName || contact?.contact_info?.lastName) {
        prospectName = `${contact?.contact_info?.firstName || ''} ${
          contact?.contact_info?.lastName || ''
        }`
      }
      const salutation = l
        .get('email_signature.outside_salutation.message', lang)
        .replace(
          '{{prospect_name}}',
          `${contact?.contact_info?.firstName} ${contact?.contact_info?.lastName}`
        )
      const final = l
        .get('prospect.no_reply_email_from_listing.final.message', lang)
        // .replace('{Landlord_name}', `${landlord_name}`)
        .replace(/\n/g, '<br />')

      let intro = l
        .get('prospect.no_reply_email_from_listing_updated.intro.message', lang)
        .replace('{Full_property_address}', this.getEmailAddressFormatter(estate, lang))

      intro = intro.replace('{{partner_name}}', publisher)

      const introLayout = `<table align="left" border="0" cellpadding="0" cellspacing="0" width = '100%'>
        <tr>${intro}</tr>
       </table>`

      const messages = {
        to: trim(email),
        from: {
          email: FromEmail,
          name: FromName,
        },
        templateId: templateId,
        dynamic_template_data: {
          subject,
          salutation: salutation,
          intro: introLayout,
          CTA: l.get('prospect.no_reply_email_from_listing.CTA.message', lang),
          link,
          final,
          logo_shown: 'none',
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
    } catch (e) {
      Logger.error(`reminderKnockSignUpEmail ${contact?.email} ${e?.message}`)
    }
  }

  static async sendTextEmail(recipient, subject, text) {
    const message = {
      to: recipient,
      from: {
        email: FromEmail,
        name: FromName,
      },
      subject,
      text,
    }

    return sgMail.send(message).then(
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

  static async sendToSupportLandlordPublishedOneEstate({ landlord }) { }

  static async sendToSupportLandlordConnectedOneEstate() { }

  static async sendToProspectForFillUpProfile({ email, lang = DEFAULT_LANG }) {
    const templateId = PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: trim(email),
      from: {
        email: FromEmail,
        name: FromName,
      },
      templateId: templateId,
      dynamic_template_data: {
        subject: l.get('prospect.notification.event.incomplete_profile', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        CTA: l.get('prospect.email_day_of_visit_reminder.CTA.message', lang), //prospect.email_fillup_profile_reminder.CTA.message
        intro: l.get('prospect.notification.next.incomplete_profile', lang),
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

}

module.exports = MailService
