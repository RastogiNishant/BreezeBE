'use strict'

const { toString } = require('lodash')
const md5 = require('md5')

const Model = require('./BaseModel')
const UserFilter = use('App/ModelFilters/UserFilter')
const Hash = use('Hash')

class User extends Model {
  static get columns() {
    return [
      'id',
      'uid',
      'email',
      'firstname',
      'secondname',
      'password',
      'phone',
      'birthday',
      'sex',
      'status',
      'device_token',
      'avatar',
      'coord',
      'lang',
      'role',
      'created_at',
      'updated_at',
      'terms_id',
      'agreements_id',
      'company_id',
      'google_id',
    ]
  }

  static get readonly() {
    return ['id', 'email', 'status', 'google_id', 'role']
  }

  static get hidden() {
    return ['password']
  }

  static boot() {
    super.boot()
    this.addTrait('@provider:Filterable', UserFilter)
    this.addTrait('Sort', this.columns)

    this.addHook('beforeSave', async (userInstance) => {
      if (userInstance.dirty.password) {
        userInstance.password = await Hash.make(userInstance.password)
      }
      if (userInstance.dirty.email || userInstance.dirty.role) {
        userInstance.uid = User.getHash(userInstance.email, userInstance.role)
      }
    })
  }

  static getHash(email, role) {
    return md5(`${email}---${role}`)
  }

  static get traits() {
    return ['@provider:Adonis/Acl/HasRole', '@provider:Adonis/Acl/HasPermission']
  }

  tokens() {
    return this.hasMany('App/Models/Token')
  }

  company() {
    return this.hasOne('App/Models/Company', 'id', 'company_id')
  }

  term() {
    return this.hasOne('App/Models/Term', 'id', 'term_id')
  }

  agreement() {
    return this.hasOne('App/Models/Agreement', 'id', 'agreement_id')
  }

  isValidToken() {
    return /^([^\.\$\[\]\#\/]){100,768}$/.test(toString(this.device_token))
  }
}

module.exports = User
