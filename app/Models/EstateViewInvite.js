'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class EstateViewInvite extends Model {
  invitedUser() {
    return this.belongsTo('App/Models/User', 'invited_user', 'id')
  }

  invitedByUser() {
    return this.belongsTo('App/Models/User', 'invited_by', 'id')
  }

  invitedEmails() {
    return this.hasMany('App/EstateViewInvitedEmails', 'id', 'estate_view_invite_id')
  }

  estate() {
    return this.belongsTo('App/Models/Estate', 'estate_id', 'id')
  }
}

module.exports = EstateViewInvite
