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

    await user.updateItem({ password: request.input('new_password') }, true)

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
      avatarUrl = await Drive.disk('s3public').put(
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
   * Password recover send email with code
   */
  async passwordReset({ request, response }) {
    const { email } = request.only(['email'])
    // Send email with reset password code
    await UserService.requestPasswordReset(email)

    return response.res()
  }

  /**
   * Confirm user password change with secret code
   */
  async passwordConfirm({ request, response }) {
    const { code, password } = request.only(['code', 'password'])
    try {
      await UserService.resetPassword(code, password)
    } catch (e) {
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400)
      }
      throw e
    }

    return response.res()
  }
}

module.exports = AccountController
