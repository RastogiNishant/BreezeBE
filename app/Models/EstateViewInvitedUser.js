'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class EstateViewInvitedUser extends Model {
  user() {
    this.belongsTo('App/Models/User', 'user_id', 'id')
  }
  estate_view_invite() {
    this.belongsTo('App/Models/EstateViewInvite', 'estate_view_invite_id', 'id')
  }
  static get traits() {
    return ['NoTimestamp']
  }
}

module.exports = EstateViewInvitedUser
