'use strict'

const { toString } = require('lodash')
const md5 = require('md5')
const { ROLE_LANDLORD, USER_ACTIVATION_STATUS_NOT_ACTIVATED } = require('../constants')

const Model = require('./BaseModel')
const UserFilter = use('App/ModelFilters/UserFilter')
const Hash = use('Hash')

class User extends Model {
  static get columns() {
    return [
      'id',
      'uid',
      'email',
      'firstname',
      'secondname',
      'password',
      'phone',
      'birthday',
      'sex',
      'status',
      'device_token',
      'avatar',
      'coord',
      'lang',
      'role',
      'created_at',
      'updated_at',
      'terms_id',
      'agreements_id',
      'company_id',
      'google_id',
      'lord_size',
      'request_full_profile',
      'notice',
      'unread_notification_count',
      'plan_id',
      'payment_plan',
      'member_plan_date',
      'prospect_visibility',
      'landlord_visibility',
      'owner_id',
      'is_onboarded',
      'is_profile_onboarded',
      'is_dashboard_onboarded',
      'is_selection_onboarded',
      'mautic_id',
      'is_household_invitation_onboarded',
      'is_landlord_verification_onboarded',
      'activation_status',
      'preferred_services',
    ]
  }

  static get readonly() {
    return ['id', 'email', 'status', 'google_id', 'role', 'password']
  }

  /**
   *
   */
  static get hidden() {
    return ['password']
  }

  /**
   *
   */
  static get Serializer() {
    return 'App/Serializers/UserSerializer'
  }

  /**
   *
   */
  static boot() {
    super.boot()
    this.addTrait('@provider:SerializerExtender')
    this.addTrait('@provider:Filterable', UserFilter)
    this.addTrait('Sort', this.columns)

    this.addHook('beforeCreate', async (userInstance) => {
      if (userInstance.role == ROLE_LANDLORD) {
        userInstance.activation_status = USER_ACTIVATION_STATUS_NOT_ACTIVATED
      }
    })

    this.addHook('beforeSave', async (userInstance) => {
      if (userInstance.dirty.password) {
        userInstance.password = await Hash.make(userInstance.password)
      }
      if (userInstance.dirty.email || userInstance.dirty.role) {
        userInstance.uid = User.getHash(userInstance.email, userInstance.role)
      }
      if (userInstance.preferred_services && Array.isArray(userInstance.preferred_services)) {
        userInstance.preferred_services = JSON.stringify(userInstance.preferred_services)
      }
    })
  }

  /**
   *
   */
  static getHash(email, role) {
    return md5(`${email}---${role}`)
  }

  /**
   *
   */
  static get traits() {
    return ['@provider:Adonis/Acl/HasRole', '@provider:Adonis/Acl/HasPermission']
  }

  /**
   *
   */
  tokens() {
    return this.hasMany('App/Models/Token')
  }

  /**
   *
   */
  company() {
    return this.belongsTo('App/Models/Company', 'company_id', 'id')
  }

  letter_template() {
    return this.hasOne('App/Models/LetterTemplate', 'id', 'user_id')
  }

  /**
   *
   */
  term() {
    return this.hasOne('App/Models/Term', 'id', 'term_id')
  }

  /**
   *
   */
  agreement() {
    return this.hasOne('App/Models/Agreement', 'id', 'agreement_id')
  }

  /**
   *
   */
  tenant() {
    return this.hasOne('App/Models/Tenant', 'id', 'user_id')
  }
  household() {
    return this.hasOne('App/Models/Tenant', 'owner_id', 'user_id')
  }
  plan() {
    return this.belongsTo('App/Models/Plan', 'plan_id', 'id')
  }
  tenantPaymentPlan() {
    return this.belongsTo('App/Models/TenantPaymentPlan', 'payment_plan', 'id')
  }
  /**
   *
   */
  isValidToken() {
    return /^([^\.\$\[\]\#\/]){100,768}$/.test(toString(this.device_token))
  }

  estates() {
    return this.hasMany('App/Models/Estate', 'id', 'user_id')
  }

  deactivationSchedule() {
    return this.hasOne('App/Models/UserDeactivationSchedule', 'id', 'user_id')
  }
}

module.exports = User
