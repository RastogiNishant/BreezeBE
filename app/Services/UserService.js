'use strict'

const uuid = require('uuid')
const { get, isArray, isEmpty } = require('lodash')

const Role = use('Role')
const Database = use('Database')
const DataStorage = use('DataStorage')
const User = use('App/Models/User')
const MailService = use('App/Services/MailService')
const AppException = use('App/Exceptions/AppException')

const { getHash } = require('../Libs/utils.js')

class UserService {
  /**
   * Create user flow
   */
  static async createUser(userData, { platform, sporting_id }) {
    const trx = await Database.beginTransaction()
    try {
      const user = await User.create(userData, trx)
      await trx.commit()

      return { user }
    } catch (e) {
      await trx.rollback()
      throw e
    }
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
