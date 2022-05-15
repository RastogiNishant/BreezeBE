'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Admin = use('App/Models/Admin')

class PrepopulateAdminSchema extends Schema {
  up() {
    this.schedule(async (trx) => {
      const admin = new Admin()
      admin.merge({
        email: 'admin@breeze4me.de',
        password: 'NjfRNtQPKzTh',
        fullname: 'Breeze4me Admin',
      })
      await admin.save(trx)
    })
  }

  down() {}
}

module.exports = PrepopulateAdminSchema
