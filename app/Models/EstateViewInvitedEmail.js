'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class EstateViewInvitedEmail extends Model {
  estateViewInvite() {
    return this.belongsTo('App/Model/EstateViewInvite', 'estate_view_invite_id', 'id')
  }
  
  static get traits() {
    return ['NoTimestamp']
  }
}

module.exports = EstateViewInvitedEmail
