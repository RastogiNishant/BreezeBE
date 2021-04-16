'use strict'

const { Command } = require('@adonisjs/ace')

const User = use('App/Models/User')
const UserService = use('App/Services/UserService')

const { ROLE_ADMIN } = require('../constants')

class CreateAdmin extends Command {
  static get signature() {
    return 'create:admin {email:Admin email} {pass:Password}'
  }

  static get description() {
    return 'Will create new user with full admin access'
  }

  async process({ email, pass }) {
    const user = new User()
    user.merge({
      password: pass,
      email,
      role: ROLE_ADMIN,
    })

    await user.save()
    await UserService.updateUserRoles(user, ['admin'])
  }

  async handle({ email, pass }, options) {
    try {
      await this.process({ email, pass })
      this.info('Create user success')
    } catch (e) {
      this.error('Create user error')
      console.log(e)
    }

    process.exit(0)
  }
}

module.exports = CreateAdmin
