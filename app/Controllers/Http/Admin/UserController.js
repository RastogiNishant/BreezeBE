'use strict'

const User = use('App/Models/User')
const Database = use('Database')
const UserService = use('App/Services/UserService')
const HttpException = use('App/Exceptions/HttpException')
const NoticeService = use('App/Services/NoticeService')

const { isEmpty, find, get } = require('lodash')
const { ROLE_ADMIN } = require('../../../constants')

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
   *
   */
  async getUsers({ request, response }) {
    const { page, size } = request.pagination
    const { filters, order } = request.only(['filters', 'order'])

    const query = User.query().select('users.*').filter(filters).sort(order)
    const users = (await query.paginate(page, size)).toJSON()

    const mixRoles = async (users) => {
      const ids = users.map((i) => i.id)
      const data = await Database.select('_ru.user_id', Database.raw('array_agg(_r.slug) as roles'))
        .from({ _ru: 'role_user' })
        .innerJoin({ _r: 'roles' }, '_r.id', '_ru.role_id')
        .whereIn('_ru.user_id', ids)
        .groupBy('_ru.user_id')

      return users.reduce((n, v) => {
        const roles = find(data, { user_id: v.id })
        return [...n, { ...v, roles: get(roles, 'roles', []) }]
      }, [])
    }
    const mixedUserRoles = await mixRoles(users.data)

    response.res({ ...users, data: mixedUserRoles })
  }

  async verifyUsers({ request, auth, response }) {
    const { ...data } = request.all()
    const userId = auth.user.id
    await UserService.verifyUsers(userId, data.ids, data.is_verify)
    NoticeService.verifyUserByAdmin(data.ids)
    response.res(data)
  }

  updateActivationStatus({ request, auth, response }) {
    const { ids, action } = request.all()
    return response.res({ ids, action })
  }
}

module.exports = UserController
