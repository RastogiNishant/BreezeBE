'use strict'

const {
  DAY_FORMAT,
  STATUS_ACTIVE,
  SALUTATION_MR_LABEL,
  SALUTATION_MS_LABEL,
  SALUTATION_SIR_OR_MADAM_LABEL,
  SALUTATION_NEUTRAL_LABEL,
  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_NEUTRAL,
  GENDER_ANY,
} = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const User = use('App/Models/User')
const MemberService = use('App/Services/MemberService')

class SynchronizingSecondnameSurnameSchema extends Schema {
  async up() {
    const estateCurrentTenants = await EstateCurrentTenant.query().whereNotNull('user_id').fetch()
    await Promise.all(
      (estateCurrentTenants.toJSON() || []).map(async (estateCurrentTenant) => {
        const user = await User.query().where('id', estateCurrentTenant.user_id).first()
        if (user) {
          const member = await MemberService.getMember(null, user.id, user.owner_id)
          await EstateCurrentTenant.query()
            .where('id', estateCurrentTenant.id)
            .update({
              user_id: user.id,
              surname: user.secondname || estateCurrentTenant.surname,
              email: user.email,
              phone_number:
                member?.phone && member?.phone_verified
                  ? member.phone
                  : user.phone_number || estateCurrentTenant.phone_number,
              salutation:
                user.sex === GENDER_MALE
                  ? SALUTATION_MR_LABEL
                  : user.sex === GENDER_FEMALE
                  ? SALUTATION_MS_LABEL
                  : user.sex === GENDER_NEUTRAL
                  ? SALUTATION_NEUTRAL_LABEL
                  : SALUTATION_SIR_OR_MADAM_LABEL,
              salutation_int: user.sex || GENDER_ANY,
            })
        } else {
          await EstateCurrentTenant.query()
            .update({ user_id: null, code: null, invite_sent_at: null })
            .where('user_id', estateCurrentTenant.user_id)
        }
      })
    )
  }

  down() {}
}

module.exports = SynchronizingSecondnameSurnameSchema
