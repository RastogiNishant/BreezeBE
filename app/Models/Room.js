'use strict'

const Model = use('Model')

class Room extends Model {
  static get columns() {
    return ['id']
  }

  estate() {
    return this.belongsTo('App/Models/Estate', 'estate_id', 'id')
  }
}

module.exports = Room
