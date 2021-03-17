'use strict'

const { toString } = require('lodash')

const Model = use('Model')
const UserFilter = use('App/ModelFilters/UserFilter')
const Hash = use('Hash')

class User extends Model {
  static get columns() {
    return [
      'id',
      'username',
      'email',
      'phone',
      'birthday',
      'sex',
      'status',
      'device_token',
      'locale',
      'avatar',
      'lang',
      'coord',
    ]
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
    })
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
