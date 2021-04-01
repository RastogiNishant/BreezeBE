'use strict'

const uuid = require('uuid')
const { get, isArray, isEmpty, pick } = require('lodash')

const Role = use('Role')
const Env = use('Env')
const Database = use('Database')
const DataStorage = use('DataStorage')
const User = use('App/Models/User')
const MailService = use('App/Services/MailService')
const AppException = use('App/Exceptions/AppException')

const { getHash } = require('../Libs/utils.js')

const { STATUS_NEED_VERIFY } = require('../constants')

class UserService {
  /**
   * Create user flow
   */
  static async createUser(userData) {
    delete userData.id
    const user = await User.create(pick(userData, User.columns))

    return { user }
  }

  /**
   *
   */
  static async createUserFromOAuth({ email, name, role, google_id, ...data }) {
    const [firstname, secondname] = name.split(' ')
    const password = `${google_id}#${Env.get('APP_NAME')}`
    const { user } = await UserService.createUser({
      ...data,
      email,
      firstname,
      secondname,
      password,
      role,
      google_id,
      status: STATUS_NEED_VERIFY,
    })

    return user
  }

  /**
   *
   */
  static async changeEmail(user, email) {
    const code = uuid.v4(email, 'change_email')
    const trx = await Database.beginTransaction()
    try {
      user.email = email
      user.confirm = false
      user.save(trx)
      await DataStorage.setItem(code, { userId: user.id }, 'change_email', { ttl: 3600 })
      await MailService.sendChangeEmailConfirmation(email, code)
      trx.commit()
    } catch (e) {
      trx.rollback()
      throw e
    }
  }

  /**
   *
   */
  static async confirmChangeEmail(code) {
    const data = await DataStorage.getItem(code, 'change_email')
    const userId = get(data, 'userId')
    if (!userId) {
      throw new AppException('Invalid confirmation code')
    }

    await User.query().update({ confirm: true })
    await DataStorage.remove(code, 'change_email')
  }

  /**
   *
   */
  static async resetUserPassword(email) {
    const code = getHash(3)
    const user = await User.findByOrFail({ email })
    await DataStorage.setItem(code, { userId: user.id }, 'reset_password', { ttl: 3600 })
    await MailService.sendResetPasswordMail(user.email, code)
  }

  /**
   *
   */
  static async resetPassword(code, password) {
    const data = await DataStorage.getItem(code, 'reset_password')
    const userId = get(data, 'userId')
    if (!userId) {
      throw new AppException('Invalid confirmation code')
    }
    const user = await User.findByOrFail({ id: userId })
    user.password = password
    await user.save()
    await DataStorage.remove(code, 'reset_password')
  }

  /**
   *
   */
  static async updateUserRoles(user, rolesSlugs) {
    await user.roles().detach()

    if (isArray(rolesSlugs) && !isEmpty(rolesSlugs)) {
      const roleIds = (await Role.query().whereIn('slug', rolesSlugs).fetch()).rows.map((i) => i.id)

      await user.roles().attach(roleIds)
    }
  }
}

module.exports = UserService
