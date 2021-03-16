'use strict'

const { reduce, toString } = require('lodash')

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
      'deleted',
      'device_token',
      'locale',
      'country_id',
      'city_id',
      'referer_id',
      'avatar',
      'block',
      'confirm',
      'created_at',
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

  isValidToken() {
    return /^([^\.\$\[\]\#\/]){100,768}$/.test(toString(this.device_token))
  }
}

module.exports = User
