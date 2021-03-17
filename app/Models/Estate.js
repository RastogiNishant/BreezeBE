'use strict'

const Model = use('Model')

class Estate extends Model {
  static get columns() {
    return ['id']
  }

  user() {
    return this.belongsTo('App/Models/Users', 'user_id', 'id')
  }
}

module.exports = Estate
