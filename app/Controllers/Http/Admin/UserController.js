'use strict'

const User = use('App/Models/User')
const Database = use('Database')
const EventService = use('App/Services/EventService')
const UserService = use('App/Services/UserService')
const HttpException = use('App/Exceptions/HttpException')

const { isEmpty, find, get } = require('lodash')

class UserController {
  /**
   * admin login
   */
  async login({ request, auth, response }) {
    const { username, password } = request.only(['username', 'password'])
    const authenticator = await auth.authenticator('jwtAdmin')

    const token = await authenticator.attempt(username, password)
    const user = await User.findByOrFail({ username })
    const roles = await user.getRoles()
    if (isEmpty(roles)) {
      throw new HttpException('Forbidden', 403)
    }

    return response.json({ token: token.token, user, roles })
  }

  /**
   *
   */
  async getUsers({ request, response }) {
    const { page, size } = request.pagination
    const { filters, order } = request.only(['filters', 'order'])

    const query = User.query()
      .select('users.*', 'countries.name AS country', 'cities.name AS city')
      .leftJoin('countries', 'countries.id', 'users.country_id')
      .leftJoin('cities', 'cities.id', 'users.city_id')
      .filter(filters)
      .sort(order)

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

    response.json({ result: { ...users, data: mixedUserRoles } })
  }

  /**
   * Get user details
   */
  async getUser({ request, auth, response }) {
    const user_id = request.params.user_id
    response.json({ user_id })
  }

  /**
   *
   */
  async updateUser({ request, auth, response }) {
    const user_id = request.params.user_id
    let { password, username, ...userData } = request.input('user')
    let roles = request.input('roles')

    const user = await User.findOrFail(user_id)
    user.merge(userData)
    // On delete user, remove password and clear roles
    if (userData.deleted === true) {
      user.merge({ password: 'deleted', deleted: true })
      roles = []
    }
    // Update password if need
    if (!isEmpty(password)) {
      user.password = password
    }
    await user.save()

    if (roles !== undefined) {
      await UserService.updateUserRoles(user, roles)
    }

    EventService.fireAdminAction('updateUser', request, auth)

    response.json({ user })
  }
}

module.exports = UserController
