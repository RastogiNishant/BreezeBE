'use strict'

const {
  MATCH_STATUS_FINISH,
  SALUTATION_SIR_OR_MADAM,
  STATUS_ACTIVE,
  DAY_FORMAT,
} = require('../../app/constants')
const moment = require('moment')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

const Match = use('App/Models/Match')
const User = use('App/Models/User')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')

class EstateCurrentTenantForFinalMatchesSchema extends Schema {
  async up() {
    const finalMatches = await Match.query().where({ status: MATCH_STATUS_FINISH }).fetch()
    Promise.all(
      finalMatches.rows.map(async (match) => {
        const tenantUser = await User.query().where('id', match.user_id).first()
        if (tenantUser) {
          const currentTenant = new EstateCurrentTenant()
          currentTenant.fill({
            estate_id: match.estate_id,
            user_id: match.user_id,
            surname: tenantUser.secondname || '',
            email: tenantUser.email,
            contract_end: moment(match.updated_at).utc().add(1, 'years').format(DAY_FORMAT),
            phone_number: tenantUser.phone_number || '',
            status: STATUS_ACTIVE,
            salutation_int: SALUTATION_SIR_OR_MADAM,
          })
          await currentTenant.save()
        }
      })
    )
  }
}

module.exports = EstateCurrentTenantForFinalMatchesSchema
