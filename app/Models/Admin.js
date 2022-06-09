'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const md5 = require('md5')
const Model = require('./BaseModel')
const Hash = use('Hash')

class Admin extends Model {
  static get columns() {
    return ['id', 'uid', 'email', 'password', 'fullname']
  }

  static get hidden() {
    return ['password']
  }

  static boot() {
    super.boot()
    this.addHook('beforeSave', async (userInstance) => {
      if (userInstance.dirty.password) {
        userInstance.password = await Hash.make(userInstance.password)
      }
      if (userInstance.dirty.email) {
        userInstance.uid = Admin.getHash(userInstance.email)
      }
    })
  }

  static getHash(email) {
    return md5(`${email}-admin`)
  }
}

module.exports = Admin
