'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class EstateViewInvite extends Model {
  invited() {
    return this.belongsTo('App/Models/User', 'invited_user', 'id')
  }

  invited_by_user() {
    return this.belongsTo('App/Models/User', 'invited_by', 'id')
  }

  estate_view_invited_emails() {
    return this.hasMany('App/EstateViewInvitedEmails', 'id', 'estate_view_invite_id')
  }
}

module.exports = EstateViewInvite
