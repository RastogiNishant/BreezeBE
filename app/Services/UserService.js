'use strict'

const uuid = require('uuid')
const { get, isArray, isEmpty } = require('lodash')
const Promise = require('bluebird')

const Role = use('Role')
const Env = use('Env')
const Event = use('Event')
const Database = use('Database')
const DataStorage = use('DataStorage')
const User = use('App/Models/User')
const Tenant = use('App/Models/Tenant')
const MailService = use('App/Services/MailService')
const AppException = use('App/Exceptions/AppException')

const { getHash } = require('../Libs/utils.js')

const {
  STATUS_NEED_VERIFY,
  STATUS_ACTIVE,
  ROLE_USER,
  ROLE_LANDLORD,
  MATCH_STATUS_FINISH,
} = require('../constants')

class UserService {
  /**
   * Create user flow
   */
  static async createUser(userData) {
    const user = await User.createItem(userData)
    if (user.role === ROLE_USER) {
      // Create empty tenant and link to user
      await Tenant.createItem({
        user_id: user.id,
      })
    }

    return { user }
  }

  /**
   *
   */
  static async createUserFromOAuth({ email, name, role, google_id, ...data }) {
    const [firstname, secondname] = name.split(' ')
    const password = `${google_id}#${Env.get('APP_NAME')}`

    // Check is user same email another role is exists
    const existingUser = await User.query()
      .where('email', email)
      .whereIn('role', [ROLE_USER, ROLE_LANDLORD])
      .first()
    if (existingUser) {
      throw new AppException('User same email, another role exists')
    }

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
  static async requestPasswordReset(email) {
    const code = getHash(3)
    const user = await User.findByOrFail({ email })
    await DataStorage.setItem(code, { userId: user.id }, 'reset_password', { ttl: 3600 })
    await MailService.sendResetPasswordMail(user.email, code)
  }

  /**
   * Reset password to all users with same email
   */
  static async resetPassword(code, password) {
    const data = await DataStorage.getItem(code, 'reset_password')
    const userId = get(data, 'userId')
    if (!userId) {
      throw new AppException('Invalid confirmation code')
    }

    const usersToUpdate = await User.query()
      .whereIn('email', function () {
        this.select('email').where('id', userId)
      })
      .limit(3)
      .fetch()

    if (!isEmpty(usersToUpdate.rows)) {
      await Promise.map(usersToUpdate.rows, (u) => u.updateItem({ password }, true))
    }

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

  /**
   *
   */
  static async sendConfirmEmail(user) {
    const date = String(new Date().getTime())
    const code = date.slice(date.length - 4, date.length)
    await DataStorage.setItem(user.id, { code }, 'confirm_email', { ttl: 3600 })
    await MailService.sendUserConfirmation(user.email, {
      code,
      user_id: user.id,
    })
  }

  /**
   *
   */
  static async confirmEmail(user, userCode) {
    const data = await DataStorage.getItem(user.id, 'confirm_email')
    const { code } = data || {}
    if (code !== userCode) {
      throw new AppException('Invalid code')
    }
    // TODO: check user status active is allow
    user.status = STATUS_ACTIVE
    await DataStorage.remove(user.id, 'confirm_email')
    return user.save()
  }

  /**
   *
   */
  static async copyUser(user, role) {
    const { id, ...data } = auth.user.toJSON()

    const result = await UserService.createUser({
      ...data,
      password: String(new Date().getTime()),
      role,
    })
    // Copy password from origin
    await Database.raw(
      'UPDATE users SET password = (SELECT password FROM users WHERE id = ? LIMIT 1) WHERE id = ?',
      [result.user.id, id]
    )

    return result.user
  }

  /**
   * Get tenant for user or create if not exists
   */
  static async getOrCreateTenant(user) {
    if (user.role !== ROLE_USER) {
      throw new AppException('Invalid tenant user role')
    }
    const tenant = await Tenant.query().where('user_id', user.id).first()
    if (tenant) {
      return tenant
    }

    return Tenant.createItem({ user_id: user.id })
  }

  /**
   *
   */
  static async calcUserZones(minId = 0) {
    const QueueService = use('App/Services/QueueService')
    const tenants = await Tenant.query()
      .whereNotNull('coord_raw')
      .whereNull('point_id')
      .where('id', '>', minId)
      .limit(1000)
      .fetch()

    return Promise.map(
      tenants.rows,
      (t) => {
        const { lat, lon } = t.getLatLon()
        if (lat && lon && t.dist_type && t.dist_min) {
          return QueueService.getAnchorIsoline(t.id)
        }

        return Promise.resolve()
      },
      { concurrency: 1 }
    )
  }

  /**
   *
   */
  static async getTenantTenantInfo(userTenantIs, landlordId) {
    const user = await User.query()
      .select('users.*')
      .select(Database.raw('? = ANY(ARRAY_AGG("_m"."share")) as share', [true]))
      .select(Database.raw('? = ANY(ARRAY_AGG("_m"."status")) as finish', [MATCH_STATUS_FINISH]))
      .leftJoin({ _m: 'matches' }, function () {
        this.on('_m.user_id', 'users.id').onIn('_m.estate_id', function () {
          this.select('id').from('estates').where({ user_id: landlordId })
        })
      })
      .where({ 'users.id': userTenantIs, 'users.role': ROLE_USER })
      .where(function () {
        this.orWhere('_m.share', true).orWhere('_m.status', MATCH_STATUS_FINISH)
      })
      .groupBy('users.id')
      .first()

    const userData = user.toJSON({ publicOnly: !user.finish })
    userData.tenant = null
    // Get tenant extend data
    if (user.share) {
      userData.tenant = await Tenant.query()
        .where('user_id', user.id)
        .with('members')
        .with('members.incomes')
        .with('members.incomes.proofs')
        .first()
    }

    return userData
  }
}

module.exports = UserService
