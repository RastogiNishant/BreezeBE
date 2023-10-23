'use strict'

const Database = use('Database')
const Model = require('./BaseModel')
const { isString } = require('lodash')

const { STATUS_ACTIVE, AMENITIES_OPTIONS } = require('../constants')

class Tenant extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'private_use',
      'pets',
      'pets_species',
      'parking_space',
      'coord',
      'dist_type',
      'dist_min',
      'budget_min',
      'budget_max',
      'include_utility',
      'rooms_min',
      'rooms_max',
      'floor_min',
      'floor_max',
      'space_min',
      'space_max',
      'apt_type',
      'house_type',
      'garden',
      'address',
      'income',
      'non_smoker',
      'options',
      'status',
      'rent_start',
      'minors_count',
      'members_count',
      'transfer_budget_min',
      'transfer_budget_max',
      'residency_duration_min',
      'residency_duration_max',
      'selected_adults_count',
      'is_short_term_rent',
      'notify_sent',
      'request_certificate_at',
      'request_certificate_city_id',
      'income_level',
      'is_public_certificate',
      'mixed_use_type_detail'
    ]
  }

  /**
   *
   */
  static get shortFieldsList() {
    return [
      'id',
      'user_id',
      'id_verified',
      'sex',
      'code',
      'status',
      'firstname',
      'secondname',
      'birthday',
      'avatar',
      'members_count',
      'minors_count',
      'percent',
      'share',
      'selected_adults_count',
      'phone_verified',
      'updated_at',
      'profession',
      'match_type',
      'total_completed_proofs',
      'submitted_proofs',
      'transfer_budget_min',
      'transfer_budget_max',
      'residency_duration_min',
      'residency_duration_max',

      'request_certificate_at',
      'request_certificate_city_id',
      'income_level',
      'is_public_certificate',
      'mixed_use_type_detail'
    ]
  }

  static get updateIgnoreFields() {
    return [
      'dist_type',
      'dist_min',
      'include_utility',
      'budget_min',
      'budget_max',
      'rooms_min',
      'rooms_max',
      'floor_min',
      'floor_max',
      'space_min',
      'space_max',
      'apt_type',
      'house_type',
      'garden',
      'options',
      'rent_start',
      'address',
      'coord',
      'transfer_budget_min',
      'transfer_budget_max',
      'is_short_term_rent',
      'residency_duration_min',
      'residency_duration_max',
      'selected_adults_count',
      'notify_sent',

      'request_certificate_at',
      'request_certificate_city_id',
      'income_level',
      'is_public_certificate'
    ]
  }

  /**
   *
   */
  static get traits() {
    return ['NoTimestamp']
  }

  /**
   *
   */
  static get Serializer() {
    return 'App/Serializers/TenantSerializer'
  }

  /**
   *
   */
  static get readonly() {
    return ['id', 'user_id', 'income']
  }

  static boot() {
    super.boot()
    this.addTrait('@provider:SerializerExtender')
    this.addHook('beforeSave', async (instance) => {
      if (instance.dirty.coord && isString(instance.dirty.coord)) {
        const [lat, lon] = instance.dirty.coord.split(',')
        instance.coord = Database.gis.setSRID(Database.gis.point(lon, lat), 4326)
        instance.coord_raw = `${lat},${lon}`
        // TODO: hook for update zone
      }
    })
  }

  user() {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }

  /**
   *
   */
  point() {
    return this.hasOne('App/Models/Point', 'point_id', 'id')
  }

  /**
   *
   */
  getLatLon() {
    const toCoord = (str, reverse = true) => {
      let [lat, lon] = String(str || '').split(',')
      ;[lat, lon] = reverse
        ? [parseFloat(lon), parseFloat(lat)]
        : [parseFloat(lat), parseFloat(lon)]

      return { lat: lat || 0, lon: lon || 0 }
    }

    return toCoord(this.coord_raw, false)
  }

  /**
   *
   */
  members() {
    return this.hasMany('App/Models/Member', 'user_id', 'user_id')
  }

  certificates() {
    return this.hasMany('App/Models/TenantCertificate', 'user_id', 'user_id')
  }

  /**
   *
   */
  isActive() {
    return this.status === STATUS_ACTIVE
  }

  /**
   *
   */
  getBudget() {
    return parseFloat(this.budget_max) || 0
  }

  /**
   *
   */
  getIncome() {
    return parseFloat(this.income) || 0
  }

  /**
   *
   */
  static async createItem(data) {
    // const options = await Database.table('options')
    //   .select('id')
    //   .whereIn('title', AMENITIES_OPTIONS)
    //   .limit(AMENITIES_OPTIONS.length)

    const options = []

    return super.createItem({
      ...data,
      options: (options || []).map((i) => i.id)
    })
  }
}

module.exports = Tenant
