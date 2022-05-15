'use strict'

const { Command } = require('@adonisjs/ace')

const Admin = use('App/Models/Admin')

class CreateAdmin extends Command {
  static get signature() {
    return 'create:admin {email:Admin Email} {password:Password} {fullname:Full Name}'
  }

  static get description() {
    return 'Will create new Administrator.'
  }

  async process({ email, password, fullname }) {
    const admin = new Admin()
    admin.merge({
      password,
      email,
      fullname,
    })
    await admin.save()
  }

  async handle({ email, password, fullname }, options) {
    try {
      await this.process({ email, password, fullname })
      this.info('Admin created successfully.')
    } catch (e) {
      this.error(e.detail)
    }

    process.exit(0)
  }
}

module.exports = CreateAdmin
