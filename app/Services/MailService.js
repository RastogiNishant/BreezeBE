'use strict'

const Mail = use('Mail')
const Config = use('Config')

class MailService {
  static async sendResetPasswordMail(email, code) {
    await Mail.send('mail/reset-password', { code }, (message) => {
      message.to(email).from(Config.get('mail.mailAccount')).subject('Reset password')
    })
  }

  static async sendChangeEmailConfirmation(email, code) {
    await Mail.send('mail/confirm-email', { code }, (message) => {
      message.to(email).from(Config.get('mail.mailAccount')).subject('Reset password')
    })
  }

  /**
   *
   */
  static async sendUserConfirmation(email, { code, user_id }) {
    return Mail.send('mail/confirm-email', { code, user_id }, (message) => {
      message.to(email).from(Config.get('mail.mailAccount')).subject('Confirm email')
    })
  }
}

module.exports = MailService
