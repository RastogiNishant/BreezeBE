'use strict'

const { get } = require('lodash')
const fs = require('fs')
const moment = require('moment')
const uuid = require('uuid')

const { sanitize } = use('Validator')
const User = use('App/Models/User')
const Hash = use('Hash')
const Drive = use('Drive')

const UserService = use('App/Services/UserService')
const ImageService = use('App/Services/ImageService')
const HttpException = use('App/Exceptions/HttpException')
/** @type {typeof import('/providers/Static')} */

class AccountController {
  /**
   *
   */
  async signup({ request, response }) {
    const userData = request.all()
    const { sporting_id, platform, referer_username, code, ...data } = sanitize(
      userData,
      User.sanitizationRules
    )

    try {
      let referer_id = null
      if (referer_username) {
        const referer = await User.query().select('id').where('username', referer_username).first()
        referer_id = get(referer, 'id', null)
      }

      console.log({ referer_username, referer_id })

      const { user } = await UserService.createUser(
        {
          ...userData,
          referer_id,
        },
        { sporting_id, platform }
      )

      // Remove confirm code from storage
      await SMSService.clearVerification(data.phone)

      return response.json({ status: 'success', user, game })
    } catch (e) {
      console.log(e)
      if (e.name === 'HttpException') {
        return response.status(e.status).json({ status: 'error', message: e.message })
      }

      return response.status(400).json({
        status: 'error',
        message: 'There was a problem creating the user, please try again later.',
      })
    }
  }

  /**
   *
   */
  async login({ request, auth, response }) {
    const { username, password, device_token } = request.all()

    // Check is user/password valid
    try {
      await auth.attempt(username, password)
    } catch (e) {
      let message = e.message.split(':')
      message.shift()
      return response.status(403).json({
        status: 'error',
        message: message.join(':').trim(),
      })
    }

    const token = await auth.attempt(username, password)

    await User.query().where('username', username).update({ device_token })

    return response.json({
      status: 'success',
      data: {
        ...token,
      },
    })
  }

  /**
   *
   */
  async me({ auth, response }) {
    const user = await User.query()
      .select('users.*', '_c.name AS city_name')
      .leftJoin({ _c: 'cities' }, '_c.id', 'users.city_id')
      .where('users.id', auth.current.user.id)
      .firstOrFail()

    return response.json({
      status: 'success',
      data: { ...user.toJSON() },
    })
  }

  /**
   *
   */
  async updateProfile({ request, auth, response }) {
    const user = auth.user
    const fields = ['birthday', 'sex', 'country_id', 'locale']
    const { preferred_currencies, city_name, ...userData } = request.only(fields)
    user.merge(userData)
    await user.save()

    return response.json({
      ...user.toJSON(),
    })
  }

  /**
   *
   */
  async changePassword({ request, auth, response }) {
    const user = auth.current.user
    const verifyPassword = await Hash.verify(request.input('current_password'), user.password)

    if (!verifyPassword) {
      return response.status(400).json({
        status: 'error',
        message: 'Current password could not be verified! Please try again.',
      })
    }

    user.password = await request.input('password')
    await user.save()

    return response.json({
      status: 'success',
      message: 'Password updated!',
    })
  }

  /**
   *
   */
  async logout({ auth, response }) {
    await User.query().where('id', auth.user.id).update({ device_token: null })
    return response.status(200).json({ success: true })
  }

  /**
   * Update device token
   */
  async updateToken({ request, auth, response }) {
    const { token } = request.only(['token'])
    await User.query().update({ device_token: token }).where('id', auth.user.id)

    return response.json({ success: true })
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

    response.json({ user: auth.user })
  }

  /**
   * Change user email and send confirm
   */
  async changeEmail({ request, auth, response }) {
    const { email } = request.only(['email'])
    await UserService.changeEmail(auth.user, email)

    response.json({ success: true })
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

    response.json({ success: true })
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
    response.json({ success: true })
  }

  /**
   * Check confirm code and change phone
   */
  async updatePhoneConfirm({ request, auth, response }) {
    const { code } = request.only(['code'])
    await SMSService.changeUserPhoneByCode(code, auth.user.id)

    response.json({ success: true })
  }

  /**
   *
   */
  async verifyPhone({ request, response }) {
    const phone = request.input('phone')
    await SMSService.sendPhoneVerify(phone)

    response.json({ success: true })
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

    response.json({ success: true })
  }
}

module.exports = AccountController
