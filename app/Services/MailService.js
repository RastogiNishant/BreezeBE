'use strict'

const { trim, capitalize, startCase, isArray, uniq } = require('lodash')
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
const ENVS_NOT_TO_SEND_MULTIPLE_EMAILS = ['localhost', 'development', 'staging', 'preprod']

const {
  ROLE_LANDLORD,
  DEFAULT_LANG,
  SEND_EMAIL_TO_OHNEMAKLER_SUBJECT,
  GERMAN_DATE_TIME_FORMAT,
  ESTATE_NO_IMAGE_COVER_URL,
  MARKETPLACE_LIST,
  PROSPECT_DEACTIVATION_STAGE_FIRST_WARNING,
  PROSPECT_DEACTIVATION_STAGE_SECOND_WARNING,
  PROSPECT_DEACTIVATION_STAGE_FINAL,
  NOTICE_TYPE_PROSPECT_REQUEST_PROFILE
} = require('../constants')
const HttpException = require('../Exceptions/HttpException')
const Logger = use('Logger')
const { createDynamicLink } = require('../Libs/utils')

const _helper = {
  async sendSGMail(msg, sendInTesting = true) {
    const emailTarget = msg.to
    const subject = msg.dynamic_template_data?.subject

    // block email if system is not prod (prevent email spam from non prod)
    if (!sendInTesting && ENVS_NOT_TO_SEND_MULTIPLE_EMAILS.includes(process.env.NODE_ENV)) {
      Logger.info(
        `Email "${msg.dynamic_template_data.subject}" not sent to "${msg.to}". System is not PRODUCTION.`
      )
      return true
    }

    return await sgMail
      .send(msg)
      .then(() => {
        Logger.info(`Email "${subject}" successfully send to "${emailTarget}"`)
      })
      .catch((error) => {
        const errorText = `Email "${subject}" failed for email "${emailTarget}" = ${error.toString()}`

        Logger.error(errorText)
        throw new HttpException(errorText)
      })
  }
}

class MailService {
  static async sendWelcomeMail(user, { code, role, lang, forgotLink = '' }) {
    const templateId = role === ROLE_LANDLORD ? LANDLORD_EMAIL_TEMPLATE : PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: trim(user.email, ' '),
      from: {
        email: FromEmail,
        name: FromName
      },
      templateId,
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
        forgot_suffix: l.get('prospect.email_forgot.password.final.message', lang)
      }
    }

    return await _helper.sendSGMail(msg)
  }

  static async sendcodeForgotPasswordMail(email, code, role, lang = DEFAULT_LANG) {
    const templateId = role === ROLE_LANDLORD ? LANDLORD_EMAIL_TEMPLATE : PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: trim(email),
      from: {
        email: FromEmail,
        name: FromName
      },
      templateId,
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
        )
      }
    }

    return await _helper.sendSGMail(msg)
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
        name: FromName
      },
      templateId,
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
        username_val: email
      }
    }
    return await _helper.sendSGMail(msg)

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
        name: FromName
      },

      subject: `Invitation to add your properties to this estate`,
      text: `Here is the link is ${shortLink}`,
      html: `<h3> Code for invitation is <b>${shortLink}</b></h3>`
    }
    return await _helper.sendSGMail(msg)
  }

  static async sendChangeEmailConfirmation(email, code, role) {
    const templateId = role === ROLE_LANDLORD ? LANDLORD_EMAIL_TEMPLATE : PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: trim(email),
      from: {
        email: FromEmail,
        name: FromName
      },
      templateId,
      dynamic_template_data: {
        subject: 'Confirm your email',
        // @FIXME undefined
        link: `${process.env.APP_URL}/account/change_email?code=${code}&user_id=${
          undefined /* was user_id */
        }`
      }
    }

    return await _helper.sendSGMail(msg)
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
        name: FromName
      },
      templateId,
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
        forgot_suffix: l.get('prospect.email_forgot.password.final.message', lang)
      }
    }

    return await _helper.sendSGMail(msg)
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
        name: FromName
      },
      templateId,
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
        username_val: user.email
      }
    }

    return await _helper.sendSGMail(msg)
  }

  async sendInviteToViewEstate(values) {
    const msg = {
      to: values.email,
      from: {
        email: FromEmail,
        name: FromName
      },
      subject: `You are invited to view this ${values.code}`,
      text: `Invited to view this Estate: ${values.code}`,
      html: `<h3> code: <b>${values.code}</b></h3>`
    }

    return await _helper.sendSGMail(msg)
  }

  static async sendUnverifiedLandlordActivationEmailToAdmin(txt) {
    const subject = `New landlord is adding property`
    const msg = {
      to: ADMIN_NOTIFY_EMAIL,
      from: FROM_ONBOARD_EMAIL, // Use the email address or domain you verified above
      subject,
      text: txt
    }

    return await _helper.sendSGMail(msg)
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
        name: FromName
      },
      templateId,
      dynamic_template_data: {
        subject: l.get('prospect.email_visit_invitation.subject.message', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        intro,
        final,
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
        )
      }
    }

    return await _helper.sendSGMail(msg)
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
        name: FromName
      },
      templateId,
      dynamic_template_data: {
        subject: l.get('prospect.email_day_of_visit_reminder.subject.message', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        intro,
        CTA: l.get('prospect.email_day_of_visit_reminder.CTA.message', lang),
        link: INVITE_APP_LINK,
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
        )
      }
    }

    return await _helper.sendSGMail(msg)
  }

  static async sendInvitationToOusideTenant(links) {
    const templateId = PROSPECT_EMAIL_TEMPLATE
    const msg = links.map((link) => {
      const lang = link?.lang || DEFAULT_LANG
      return {
        to: trim(link.email),
        from: {
          email: FromEmail,
          name: FromName
        },
        templateId,
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
          )
        }
      }
    })

    return await _helper.sendSGMail(msg)
  }

  static async inviteLandlordFromTenant({ prospect_email, task, link, lang = DEFAULT_LANG }) {
    const templateId = LANDLORD_EMAIL_TEMPLATE

    const address = generateAddress({
      street: task?.property_address?.street,
      house_number: task?.property_address?.house_number,
      zip: task?.property_address?.postcode,
      city: task?.property_address?.city,
      country: task?.property_address?.country
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
        name: FromName
      },
      templateId,
      dynamic_template_data: {
        subject: l.get('landlord.email_connect_invitation.subject.message', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        intro,
        final,
        CTA: l.get('landlord.email_connect_invitation.CTA.message', lang),
        link,
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
        )
      }
    }

    return await _helper.sendSGMail(msg)
  }

  static async estatePublishRequestApproved(estate) {
    const lang = estate.lang || DEFAULT_LANG
    const templateId = LANDLORD_EMAIL_TEMPLATE
    const address = generateAddress({
      street: estate?.street,
      house_number: estate?.house_number,
      zip: estate?.postcode,
      city: estate?.city,
      country: estate?.country
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
        name: FromName
      },
      templateId,
      dynamic_template_data: {
        subject: l.get('landlord.email_property_published.subject.message', lang),
        salutation: '',
        intro,
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
        )
      }
    }
    return await _helper.sendSGMail(msg)
  }

  static async sendEmailToSupport({ subject, textMessage, htmlMessage = '' }) {
    const msg = {
      to: FromEmail,
      from: {
        email: FromEmail,
        name: FromName
      },
      subject,
      text: textMessage
    }

    if (htmlMessage) {
      msg.html = htmlMessage
    }

    return await _helper.sendSGMail(msg)
  }

  static async sendEmailToOhneMakler(textMessage, recipient, sendToBCC = false) {
    const msg = {
      to: recipient,
      from: {
        email: FromEmail,
        name: FromName
      },
      subject:
        SEND_EMAIL_TO_OHNEMAKLER_SUBJECT +
        moment.utc().add(2, 'hours').format(GERMAN_DATE_TIME_FORMAT),
      text: textMessage
    }
    if (sendToBCC) {
      msg.bcc = [sendToBCC]
    }

    return await _helper.sendSGMail(msg)
  }

  static async sendEmailWithAttachment({
    textMessage,
    recipient,
    bcc = null,
    subject,
    attachment,
    from
  }) {
    const msg = {
      to: recipient,
      from,
      subject,
      text: textMessage,
      attachments: [
        {
          content: attachment,
          filename: 'Anfrage.xml',
          type: 'application/xml',
          disposition: 'attachment',
          content_id: 'breeze-attachment'
        }
      ]
    }
    if (bcc) {
      msg.bcc = bcc
    }
    return await _helper.sendSGMail(msg)
  }

  static getEmailAddressFormatter(estate, lang) {
    const formatter = new Intl.NumberFormat('de-DE')
    const floor =
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

  static async reminderKnockSignUpEmail({ link, email, recipient, estate, lang = DEFAULT_LANG }) {
    try {
      const templateId = PROSPECT_EMAIL_TEMPLATE
      const final = l
        .get('prospect.no_reply_email_to_complete_profile.final.message', lang)
        // .replace('{Landlord_name}', `${landlord_name}`)
        .replace(/\n/g, '<br />')

      const intro = l
        .get('prospect.no_reply_email_to_complete_profile.intro.message', lang)
        .replace('{Full_property_address}', this.getEmailAddressFormatter(estate, lang))

      const introLayout = `<table align="left" border="0" cellpadding="0" cellspacing="0" width = '100%'>
        <tr>${intro}</tr>
       </table>`

      const msg = {
        to: trim(email),
        from: {
          email: FromEmail,
          name: FromName
        },
        templateId,
        dynamic_template_data: {
          subject: l.get('prospect.no_reply_email_to_complete_profile.subject.message', lang),
          salutation: l
            .get('email_signature.outside_salutation.message', lang)
            .replace('{{prospect_name}}', recipient),
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
          )
        }
      }

      return await _helper.sendSGMail(msg)
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

      const msg = {
        to: trim(email),
        from: {
          email: FromEmail,
          name: FromName
        },
        templateId,
        dynamic_template_data: {
          subject,
          salutation,
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
          )
        }
      }

      return await _helper.sendSGMail(msg)
    } catch (e) {
      Logger.error(`reminderKnockSignUpEmail ${contact?.email} ${e?.message}`)
    }
  }

  static async sendTextEmail(recipient, subject, text) {
    const msg = {
      to: recipient,
      from: {
        email: FromEmail,
        name: FromName
      },
      subject,
      text
    }

    return await _helper.sendSGMail(msg)
  }

  static async sendToSupportLandlordPublishedOneEstate() {}

  static async sendToSupportLandlordConnectedOneEstate() {}

  static async sendToProspectForFillUpProfile({ email, lang = DEFAULT_LANG }) {
    const templateId = PROSPECT_EMAIL_TEMPLATE
    const msg = {
      to: isArray(email) ? uniq(email) : trim(email),
      from: {
        email: FromEmail,
        name: FromName
      },
      templateId,
      dynamic_template_data: {
        subject: l.get('prospect.notification.event.incomplete_profile', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        CTA: l.get('prospect.email_day_of_visit_reminder.CTA.message', lang),
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
        )
      }
    }

    return _helper.sendSGMail(msg)
  }

  static async sendLandlordInviteStageProspectMessageNotification(recipient) {
    const templateId = PROSPECT_EMAIL_TEMPLATE
    const msg = {
      to: recipient,
      from: {
        email: FromEmail,
        name: FromName
      },
      templateId,
      subject: l.get('prospect.email_message_from_landlord.subject.message'),
      text: `REPLY \n ${l.get('prospect.email_message_from_landlord.CTA.message')} \n ${l.get(
        'prospect.email_account_inactivity_deletion.final.message'
      )} \n ${l.get('prospect.email_message_from_landlord.final.message')}`
    }

    return await _helper.sendSGMail(msg)
  }

  static async sendRequestToTenantForShareProfile(
    { prospectEmail, estate, landlord, visitDate, avatar, lang = DEFAULT_LANG },
    eventType = NOTICE_TYPE_PROSPECT_REQUEST_PROFILE
  ) {
    const templateId = PROSPECT_EMAIL_TEMPLATE
    const subject = l
      .get('prospect.email_request_sharing_profile_after_visit.subject.message', lang)
      .replace('{landlord}', landlord)

    const intro = l
      .get('prospect.email_request_sharing_profile_after_visit.intro.message', lang)
      .replace('{landlord}', landlord)
      .replace('{Full_property_address}', this.getEmailAddressFormatter(estate, lang))

    const { id, street, house_number, zip, city, country } = estate

    const deepLink = new URL(`${process.env.DEEP_LINK}`)

    // Append query parameters
    deepLink.searchParams.append('type', eventType)
    deepLink.searchParams.append('landlord', landlord)
    deepLink.searchParams.append('estate_id', id)
    deepLink.searchParams.append('street', street)
    deepLink.searchParams.append('house_number', house_number)
    deepLink.searchParams.append('postcode', zip)
    deepLink.searchParams.append('city', city)
    deepLink.searchParams.append('country', country)
    deepLink.searchParams.append('date', visitDate)
    deepLink.searchParams.append('landlord_logo', avatar)

    const shareLink = await createDynamicLink(deepLink.toString())

    const msg = {
      to: trim(prospectEmail),
      from: {
        email: FromEmail,
        name: FromName
      },
      templateId,
      dynamic_template_data: {
        subject,
        salutation: l.get('email_signature.salutation.message', lang),
        CTA: l.get('prospect.email_request_sharing_profile_after_visit.CTA.message', lang),
        intro,
        link: shareLink,
        final: l.get('prospect.email_request_sharing_profile_after_visit.final.message', lang),
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
        )
      }
    }
    return await _helper.sendSGMail(msg)
  }

  static async sendToProspectThatLandlordSentMessage(
    {
      email,
      message,
      recipient = null,
      estate_id,
      estate,
      topic = null,
      task_id = null,
      type = null,
      lang = DEFAULT_LANG
    },
    eventType = 'PROSPECT_RECEIVES_MESSAGE'
  ) {
    const templateId = PROSPECT_EMAIL_TEMPLATE
    let shortLink
    if (eventType === 'PROSPECT_RECEIVES_MESSAGE') {
      const { sex, firstname, secondname, avatar } = recipient
      shortLink = await createDynamicLink(
        `${process.env.DEEP_LINK}?type=${eventType}&estate_id=${estate_id}&email=${email}&topic=${topic}&task_id=${task_id}` +
          `&firstname=${firstname}&secondname=${secondname}&avatar=${avatar}&type=${type}&sex=${sex}`
      )
    } else {
      shortLink = await createDynamicLink(
        `${process.env.DEEP_LINK}?type=${eventType}&estate_id=${estate_id}`
      )
    }
    const estateAddress = this.getEmailAddressFormatter(estate, lang)
    const msg = {
      to: isArray(email) ? uniq(email) : trim(email),
      from: {
        email: FromEmail,
        name: FromName
      },
      templateId,
      dynamic_template_data: {
        subject: l.get('prospect.email_message_from_landlord.subject.message', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        CTA: l.get('prospect.email_message_from_landlord.CTA.message', lang),
        intro:
          estateAddress +
          `<br /><br />` +
          l
            .get('prospect.email_message_from_landlord.intro.message', lang)
            .replace('{{message_content}}', message),
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
        )
      }
    }
    return await _helper.sendSGMail(msg)
  }

  static async sendToProspectForAccountInactivityFirstReminder({ email, lang = DEFAULT_LANG }) {
    const templateId = PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: trim(email),
      from: {
        email: FromEmail,
        name: FromName
      },
      templateId,
      dynamic_template_data: {
        subject: l.get(
          'prospect.email_account_inactivity_two_weeks_reminder.subject.message',
          lang
        ),
        salutation: l.get('email_signature.salutation.message', lang),
        CTA: l.get('prospect.email_account_inactivity_two_weeks_reminder.CTA.message', lang),
        intro: l.get('prospect.email_account_inactivity_two_weeks_reminder.intro.message', lang),
        final: l.get('prospect.email_account_inactivity_two_weeks_reminder.final.message', lang),
        greeting: l.get('email_signature.greeting.message', lang),
        link: INVITE_APP_LINK,
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
        )
      }
    }
    return await _helper.sendSGMail(msg, false)
  }

  static async sendToProspectForAccountInactivitySecondReminder({ email, lang = DEFAULT_LANG }) {
    const templateId = PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: trim(email),
      from: {
        email: FromEmail,
        name: FromName
      },
      templateId,
      dynamic_template_data: {
        subject: l.get('prospect.email_account_inactivity_one_week_reminder.subject.message', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        CTA: l.get('prospect.email_account_inactivity_one_week_reminder.CTA.message', lang),
        intro: l.get('prospect.email_account_inactivity_one_week_reminder.intro.message', lang),
        final: l.get('prospect.email_account_inactivity_one_week_reminder.final.message', lang),
        greeting: l.get('email_signature.greeting.message', lang),
        link: INVITE_APP_LINK,
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
        )
      }
    }
    return await _helper.sendSGMail(msg, false)
  }

  static async sendToProspectForAccountDeletion({ email, lang = DEFAULT_LANG }) {
    const templateId = PROSPECT_EMAIL_TEMPLATE

    const msg = {
      to: trim(email),
      from: {
        email: FromEmail,
        name: FromName
      },
      templateId,
      dynamic_template_data: {
        subject: l.get('prospect.email_account_inactivity_deletion.subject.message', lang),
        salutation: l.get('email_signature.salutation.message', lang),
        CTA: l.get('prospect.email_account_inactivity_deletion.CTA.message', lang),
        intro: l.get('prospect.email_account_inactivity_deletion.intro.message', lang),
        final: l.get('prospect.email_account_inactivity_deletion.final.message', lang),
        greeting: l.get('email_signature.greeting.message', lang),
        link: INVITE_APP_LINK,
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
        )
      }
    }
    return await _helper.sendSGMail(msg, false)
  }

  static async sendToProspectScheduledForDeactivation({ emails, lang = DEFAULT_LANG, stage }) {
    const templateId = PROSPECT_EMAIL_TEMPLATE
    let subject = 'prospect.{replace}.subject.message'
    let intro = 'prospect.{replace}.intro.message'
    let CTA = 'prospect.{replace}.CTA.message'
    let final = 'prospect.{replace}.final.message'
    let toReplace = ''
    switch (stage) {
      case PROSPECT_DEACTIVATION_STAGE_FIRST_WARNING:
        toReplace = 'email_first_warning_for_profile_deactivation'
        break
      case PROSPECT_DEACTIVATION_STAGE_SECOND_WARNING:
        toReplace = 'email_second_warning_for_profile_deactivation'
        break
      case PROSPECT_DEACTIVATION_STAGE_FINAL:
        toReplace = 'email_profile_deactivation_email'
        break
    }
    subject = subject.replace(/\{replace\}/, toReplace)
    intro = intro.replace(/\{replace\}/, toReplace)
    CTA = CTA.replace(/\{replace\}/, toReplace)
    final = final.replace(/\{replace\}/, toReplace)

    const msg = {
      to: emails.pop(), // we need a to here so we pop()
      from: {
        email: FromEmail,
        name: FromName
      },
      templateId,
      dynamic_template_data: {
        subject: l.get(subject, lang),
        salutation: l.get('email_signature.salutation.message', lang),
        CTA: l.get(CTA, lang),
        intro: l.get(intro, lang),
        final: l.get(final, lang),
        greeting: l.get('email_signature.greeting.message', lang),
        link: INVITE_APP_LINK,
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
        )
      }
    }
    if (emails.length) {
      // we add all other emails as blind carbon copies
      msg.bcc = emails
    }
    return await _helper.sendSGMail(msg, false)
  }

  static async sendMessageToMarketplaceProspect({ email, message, estate, lang = DEFAULT_LANG }) {
    const templateId = PROSPECT_EMAIL_TEMPLATE
    const final = `${l.get('landlord.no_reply_email_marketplaces_user.final.message', lang)}`
    const propertyInfo = MailService.getEmailAddressFormatter(estate, lang)
    const msg = {
      to: trim(email),
      from: {
        email: FromEmail,
        name: FromName
      },
      templateId,
      dynamic_template_data: {
        subject: l
          .get('landlord.no_reply_email_marketplaces_user.subject.message', lang)
          .replace('{{property_address}}', estate.address.replace(/\w+/g, capitalize)),
        salutation: l.get('email_signature.salutation.message', lang),
        CTA: l.get('landlord.no_reply_email_marketplaces_user.CTA.message', lang),
        intro: l
          .get('landlord.no_reply_email_marketplaces_user.intro.message', lang)
          .replace('{{message}}', `<br>` + message.replace(/(?:\r\n|\r|\n)/g, '<br>') + `<br><br>`)
          .replace('{Full_property_address}}', propertyInfo),
        final,
        greeting: l.get('email_signature.greeting.message', lang),
        link: INVITE_APP_LINK,
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
        )
      }
    }
    return await _helper.sendSGMail(msg)
  }
}

module.exports = MailService
