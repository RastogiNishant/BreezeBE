'use strict'

const moment = require('moment')
const { isString, isArray, pick, trim, isEmpty, omit } = require('lodash')
const hash = require('../Libs/hash')
const Database = use('Database')

const Model = require('./BaseModel')
const {
  BATH_TUB,
  BATH_WINDOW,
  BATH_BIDET,
  BATH_URINAL,
  BATH_SHOWER,
  //
  KITCHEN_OPEN,
  KITCHEN_PANTRY,
  KITCHEN_BUILTIN,
  //
  EQUIPMENT_STACK,
  EQUIPMENT_AIR_CONDITIONED,
  EQUIPMENT_ELEVATOR,
  EQUIPMENT_GARDEN_USE,
  EQUIPMENT_WHEELCHAIR_ACCESSIBLE,
  EQUIPMENT_BIKE_ROOM,
  EQUIPMENT_GUEST_WC,
  EQUIPMENT_WG_SUITABLE,

  STATUS_DRAFT,
  STATUS_ACTIVE,
} = require('../constants')

class Estate extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'property_type',
      'type',
      'apt_type',
      'house_type',
      'description',
      'category',
      'coord',
      'street',
      'house_number',
      'country',
      'floor',
      'number_floors',
      'prices',
      'net_rent',
      'cold_rent',
      'rent_including_heating',
      'additional_costs',
      'heating_costs_included',
      'heating_costs',
      'rent_per_sqm',
      'deposit',
      'stp_garage',
      'stp_parkhaus',
      'stp_tiefgarage',
      'currency',
      'area',
      'living_space',
      'usable_area',
      'rooms_number',
      'bedrooms_number',
      'bathrooms_number',
      'kitchen_options',
      'bath_options',
      'wc_number',
      'balconies_number',
      'terraces_number',
      'occupancy',
      'use_type',
      'ownership_type',
      'marketing_type',
      'energy_type',
      'available_date',
      'from_date',
      'to_date',
      'min_lease_duration',
      'max_lease_duration',
      'non_smoker',
      'pets',
      'gender',
      'monumental_protection',
      'parking_space',
      'parking_space_type',
      'construction_year',
      'last_modernization',
      'building_status',
      'building_age',
      'firing',
      'heating_type',
      'equipment',
      'equipment_standard',
      'ground',
      'energy_efficiency',
      'energy_pass',
      'status',
      'property_id',
      'plan',
      'cover',
      'point_id',
      'repair_need',
      'city',
      'zip',
      'budget',
      'credit_score',
      'rent_arrears',
      'full_address',
      'kids_type',
      'photo_require',
      'furnished',
      'source_person',
      'address',
      'family_status',
      'min_age',
      'max_age',
      'hash',
      'options',
      'avail_duration',
      'vacant_date',
    ]
  }

  /**
   *
   */
  static get readonly() {
    return ['id', 'status', 'user_id', 'plan', 'point_id', 'hash']
  }

  /**
   *
   */
  static get options() {
    return {
      bath_options: [BATH_TUB, BATH_WINDOW, BATH_BIDET, BATH_URINAL, BATH_SHOWER],
      kitchen_options: [KITCHEN_OPEN, KITCHEN_PANTRY, KITCHEN_BUILTIN],
      equipment: [
        EQUIPMENT_STACK,
        EQUIPMENT_AIR_CONDITIONED,
        EQUIPMENT_ELEVATOR,
        EQUIPMENT_GARDEN_USE,
        EQUIPMENT_WHEELCHAIR_ACCESSIBLE,
        EQUIPMENT_BIKE_ROOM,
        EQUIPMENT_GUEST_WC,
        EQUIPMENT_WG_SUITABLE,
      ],
    }
  }

  static get shortFieldsList() {
    return [
      'id',
      'coord',
      'net_rent',
      'area',
      'cover',
      'rooms_number',
      'status',
      'match',
      'updated_at',
    ]
  }

  /**
   *
   */
  static get Serializer() {
    return 'App/Serializers/EstateSerializer'
  }

  /**
   *
   */
  static boot() {
    super.boot()
    this.addTrait('@provider:SerializerExtender')
    this.addHook('beforeSave', async (instance) => {
      if (instance.dirty.coord && isString(instance.dirty.coord)) {
        const [lat, lon] = instance.dirty.coord.split(',')
        instance.coord_raw = instance.dirty.coord
        instance.coord = Database.gis.setSRID(Database.gis.point(lon, lat), 4326)
      }

      if (!isEmpty(pick(instance.dirty, ['house_number', 'street', 'city', 'zip', 'country']))) {
        instance.address = trim(
          `${instance.street || ''} ${instance.house_number || ''}, ${instance.zip || ''} ${
            instance.city || ''
          }, ${instance.country || ''}`,
          ', '
        ).toLowerCase()
      }

      if (instance.dirty.plan && !isString(instance.dirty.plan)) {
        try {
          instance.plan = isArray(instance.dirty.plan) ? JSON.stringify(instance.dirty.plan) : null
        } catch (e) {}
      }
    })

    this.addHook('afterCreate', async (instance) => {
      await Database.table('estates')
        .update({ hash: Estate.getHash(instance.id) })
        .where('id', instance.id)
    })
  }

  /**
   *
   */
  user() {
    return this.belongsTo('App/Models/Users', 'user_id', 'id')
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
  rooms() {
    return this.hasMany('App/Models/Room')
  }

  /**
   *
   */
  files() {
    return this.hasMany('App/Models/File')
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
  static getHash(id) {
    return hash.crc32(`estate_${id}`, true)
  }

  /**
   *
   */
  async publishEstate() {
    await this.updateItem(
      {
        status: STATUS_ACTIVE,
        available_date: moment().add('hours', this.avail_duration).toDate(),
      },
      true
    )
  }

  /**
   *
   */
  async updateItem(data, force = true) {
    const exclude = force ? [] : this.constructor.readonly || []
    data = omit(pick(data, this.constructor.columns || []), exclude)
    // Force update status to draft on any update anyway
    data.status = STATUS_DRAFT
    this.merge(data)

    return this.save()
  }
}

module.exports = Estate
