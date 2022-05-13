'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const md5 = require('md5')
const Model = require('./BaseModel')
const Hash = use('Hash')

class Admin extends Model {
  static get columns() {
    return ['id', 'uid', 'email', 'password', 'fullname']
  }
}

module.exports = Admin
