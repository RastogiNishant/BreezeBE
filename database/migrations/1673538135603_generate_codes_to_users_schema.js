'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const User = use('App/Models/User')
const randomstring = require('randomstring')
class GenerateCodesToUsersSchema extends Schema {
  async up() {
    const users = (await User.query().fetch()).toJSON()
    let i = 0
    if (!users || !users.length) {
      return
    }

    while (i < users.length) {
      const code = randomstring.generate({
        length: 10,
        charset: 'alphanumeric',
      })
      await User.query().where('id', users[i].id).update({ code })
      i++
    }
  }

  down() {}
}

module.exports = GenerateCodesToUsersSchema
