'use strict'

const Model = use('Model')

class Company extends Model {
  static get columns() {
    return ['id']
  }

  users() {
    return this.hasMany('App/Models/Users')
  }
}

module.exports = Company
