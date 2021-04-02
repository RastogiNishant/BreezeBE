'use strict'
const fs = require('fs')
const moment = require('moment')
const uuid = require('uuid')
const { isEmpty } = require('lodash')

const User = use('App/Models/User')
const Hash = use('Hash')
const Drive = use('Drive')
const Logger = use('Logger')

const UserService = use('App/Services/UserService')
const MailService = use('App/Services/MailService')
const ImageService = use('App/Services/ImageService')
const HttpException = use('App/Exceptions/HttpException')
/** @type {typeof import('/providers/Static')} */

const { ROLE_ADMIN, ROLE_LANDLORD, ROLE_USER, STATUS_EMAIL_VERIFY } = require('../../constants')

class AccountController {
  /**
   *
   */
  async signup({ request, response }) {
    const userData = request.all()
    if (![ROLE_LANDLORD, ROLE_USER].includes(userData.role)) {
      throw new HttpException('Invalid user role', 401)
    }

    try {
      const { user } = await UserService.createUser({ ...userData, status: STATUS_EMAIL_VERIFY })
      await UserService.sendConfirmEmail(user)
      return response.res(user)
    } catch (e) {
      if (e.constraint === 'users_uid_unique') {
        throw new HttpException('User already exists', 400)
      }

      throw e
    }
  }

  /**
   *
   */
  async confirmEmail({ request, response }) {
    const { code, user_id } = request.all()
    const user = await User.findOrFail(user_id)
    try {
      await UserService.confirmEmail(user, code)
    } catch (e) {
      Logger.error(e)
      throw new HttpException(e.message, 400)
    }

    return response.res(true)
  }

  /**
   *
   */
  async login({ request, auth, response }) {
    let { email, role, password, device_token } = request.all()

    // Select role if not set, (allows only for non-admin users)
    if (isEmpty(role)) {
      const user = await User.query()
        .where('email', email)
        .whereIn('role', [ROLE_USER, ROLE_LANDLORD])
        .orderBy('updated_at', 'desc')
        .first()
      if (!user) {
        throw new HttpException('User not found', 404)
      }
      role = user.role
    }

    let authenticator
    switch (role) {
      case ROLE_USER:
        authenticator = await auth.authenticator('jwt')
        break
      case ROLE_LANDLORD:
        authenticator = await auth.authenticator('jwtLandlord')
        break
      case ROLE_ADMIN:
        authenticator = await auth.authenticator('jwtAdmin')
        break
      default:
        throw new HttpException('Invalid user role', 403)
    }

    const uid = User.getHash(email, role)
    let token
    try {
      token = await authenticator.attempt(uid, password)
    } catch (e) {
      const [error, message] = e.message.split(':')
      throw new HttpException(message, 401)
    }

    if (device_token) {
      await User.query().where('email', email).update({ device_token })
    }

    return response.res(token)
  }

  /**
   *
   */
  async me({ auth, response }) {
    const user = await User.query()
      .select('users.*')
      .where('users.id', auth.current.user.id)
      .firstOrFail()

    return response.res(user)
  }

  /**
   *
   */
  async logout({ auth, response }) {
    await User.query().where('id', auth.user.id).update({ device_token: null })
    return response.res()
  }

  /**
   *
   */
  async updateProfile({ request, auth, response }) {
    const data = request.all()
    const user = auth.user
    await user.updateItem(data)

    return response.res(user)
  }

  /**
   *
   */
  async changePassword({ request, auth, response }) {
    const user = auth.current.user
    const verifyPassword = await Hash.verify(request.input('current_password'), user.password)

    if (!verifyPassword) {
      throw HttpException('Current password could not be verified! Please try again.', 400)
    }

    user.password = await request.input('password')
    await user.save()

    return response.res()
  }

  /**
   * Update device token
   */
  async updateToken({ request, auth, response }) {
    const { token } = request.only(['token'])
    await User.query().update({ device_token: token }).where('id', auth.user.id)

    return response.res()
  }

  /**
   *
   */
  async updateAvatar({ request, auth, response }) {
    const fileSettings = { types: ['image'], size: '10mb' }
    const filename = `${uuid.v4()}.png`
    let avatarUrl, tmpFile
    request.multipart.file(`file`, fileSettings, async (file) => {
      tmpFile = await ImageService.resizeAvatar(file, filename)
      const sourceStream = fs.createReadStream(tmpFile)
      avatarUrl = await Drive.disk('s3uploads').put(
        `${moment().format('YYYYMM')}/${filename}`,
        sourceStream,
        { ACL: 'public-read', ContentType: 'image/png' }
      )
    })
    await request.multipart.process()
    if (avatarUrl) {
      auth.user.avatar = avatarUrl
      await auth.user.save()
    }
    fs.unlink(tmpFile, () => {})

    response.res(auth.user)
  }

  /**
   * Change user email and send confirm
   */
  async changeEmail({ request, auth, response }) {
    const { email } = request.only(['email'])
    await UserService.changeEmail(auth.user, email)

    response.res()
  }

  /**
   * Mark user as confirmed
   */
  async confirmChangeEmail({ request, response }) {
    const { code } = request.only(['code'])
    await UserService.confirmChangeEmail(code)

    return response.redirect('/email-confirmed')
  }

  /**
   * Email confirm success route
   */
  async emailConfirmed({ view }) {
    return view.render('confirm-email-success')
  }

  /**
   * Password recover send email with code
   */
  async passwordRecoveryRequest({ request, response }) {
    const { email } = request.only(['email'])

    // Send email with reset password code
    await UserService.resetUserPassword(email)

    response.res()
  }

  /**
   * Confirm user password change with secret code
   */
  async passwordRecoveryConfirm({ request, view }) {
    const { code, password } = request.only(['code', 'password'])
    await UserService.resetPassword(code, password)

    return view.render('reset-pass-form-success')
  }

  /**
   *
   */
  async passwordRecovery({ request, view }) {
    const { code } = request.only(['code'])

    return view.render('reset-pass-form', { code })
  }

  /**
   * Send sms to phone for number confirm
   */
  async updatePhoneRequest({ request, auth, response }) {
    const { phone } = request.only(['phone'])
    await SMSService.sendPhoneConfirm(phone, auth.user.id)
    response.res()
  }

  /**
   * Check confirm code and change phone
   */
  async updatePhoneConfirm({ request, auth, response }) {
    const { code } = request.only(['code'])
    await SMSService.changeUserPhoneByCode(code, auth.user.id)

    response.res()
  }

  /**
   *
   */
  async verifyPhone({ request, response }) {
    const phone = request.input('phone')
    await SMSService.sendPhoneVerify(phone)

    response.res()
  }

  /**
   *
   */
  async verifyPhoneConfirm({ request, response }) {
    const { phone, code } = request.all()
    const isVerified = await SMSService.verifyConfirmationCode(phone, code)
    if (!isVerified) {
      throw new HttpException('Invalid verification code', 400)
    }

    response.res()
  }
}

module.exports = AccountController
