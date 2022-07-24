'use strict'

const User = use('App/Models/User')
const Database = use('Database')
const UserService = use('App/Services/UserService')
const HttpException = use('App/Exceptions/HttpException')
const NoticeService = use('App/Services/NoticeService')
const moment = require('moment')
const Event = use('Event')
const { isArray, isEmpty, find, get } = require('lodash')
const {
  ROLE_ADMIN,
  ROLE_LANDLORD,
  USER_ACTIVATION_STATUS_NOT_ACTIVATED,
  USER_ACTIVATION_STATUS_ACTIVATED,
  USER_ACTIVATION_STATUS_DEACTIVATED,
  STATUS_DELETE,
  STATUS_ACTIVE,
  STATUS_DRAFT,
} = require('../../../constants')

class UserController {
  /**
   * admin login
   */
  async login({ request, auth, response }) {
    const { email, password } = request.all()
    const authenticator = await auth.authenticator('jwtAdmin')

    const uid = User.getHash(email, ROLE_ADMIN)

    const token = await authenticator.attempt(uid, password)

    const user = await User.findByOrFail({ email, role: ROLE_ADMIN })
    const roles = await user.getRoles()
    if (isEmpty(roles)) {
      throw new HttpException('Forbidden', 403)
    }

    return response.res({ token: token.token, user, roles })
  }

  /**
   * This endpoint is wrong on the roles. roles can be agg'd by email
   */
  async getUsers({ request, response }) {
    const { filters, order, role } = request.only(['filters', 'order', 'role'])

    const query = User.query()
      .select(Database.raw(`users.*, concat(users.firstname, ' ', users.secondname) as fullname`))
      .where('role', role)
      .whereNot('status', STATUS_DELETE)
      .filter(filters)
      .orderBy(order.by, order.direction)

    const users = await query.fetch()
    //FIXME: should propbably add an isAdmin param here...
    response.res(users.toJSON({ isOwner: true }))
  }

  //this is missing before... just the basic query on users using id
  async getUser({ request, response }) {
    const user_id = request.params.user_id
    const user = await User.query().where('id', user_id).first()
    response.res(user)
  }

  async updateUser({ request, response }) {
    const user_id = request.params.user_id
    response.res({ user_id })
  }

  async verifyUsers({ request, auth, response }) {
    const { ...data } = request.all()
    const userId = auth.user.id
    await UserService.verifyUsers(userId, data.ids, data.is_verify)
    NoticeService.verifyUserByAdmin(data.ids)
    response.res(data)
  }

  async updateActivationStatus({ request, auth, response }) {
    const { ids, action } = request.all()
    let affectedRows = 0
    switch (action) {
      case 'activate':
        affectedRows = await User.query()
          .whereIn('id', ids)
          .update({
            activation_status: USER_ACTIVATION_STATUS_ACTIVATED,
            is_verified: true,
            verified_by: auth.user.id,
            verified_date: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
          })
        NoticeService.verifyUserByAdmin(ids)
        break
      case 'deactivate':
        Event.fire('landlord::deactivate', ids)
        affectedRows = await User.query().whereIn('id', ids).update({
          activation_status: USER_ACTIVATION_STATUS_DEACTIVATED,
          is_verified: false,
          verified_by: null,
          verified_date: null,
        })
        break
    }
    return response.res({ affectedRows })
  }

  async getLandlords({ request, response }) {
    let { activation_status, status, estate_status, page, limit, query } = request.all()
    if (!activation_status) {
      activation_status = [
        USER_ACTIVATION_STATUS_NOT_ACTIVATED,
        USER_ACTIVATION_STATUS_ACTIVATED,
        USER_ACTIVATION_STATUS_DEACTIVATED,
      ]
    }
    status = status || STATUS_ACTIVE
    estate_status = estate_status || STATUS_DRAFT
    limit = 99999
    const landlordQuery = User.query()
      .where('role', ROLE_LANDLORD)
      .whereIn('status', isArray(status) ? status : [status])
      .whereIn(
        'activation_status',
        isArray(activation_status) ? activation_status : [activation_status]
      )
      .with('estates', function (e) {
        e.whereNot('status', STATUS_DELETE)
        e.whereIn('status', isArray(estate_status) ? estate_status : [estate_status])
      })
      .with('company', function (query) {
        query.with('contacts')
      })
    if (query) {
      landlordQuery.andWhere(function (d) {
        d.orWhere('email', 'ilike', `${query}%`)
        d.orWhere('firstname', 'ilike', `${query}%`)
        d.orWhere('secondname', 'ilike', `${query}%`)
      })
    }
    const landlords = await landlordQuery.orderBy('users.id', 'asc').paginate(page, limit)
    //let's return all info... this is admin
    const users = landlords.toJSON({ publicOnly: false })
    return response.res(users)
  }
}

module.exports = UserController
