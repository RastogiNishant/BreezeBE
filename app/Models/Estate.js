'use strict'

const { isString, isArray } = require('lodash')
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
} = require('../constants')

class Estate extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'property_type',
      'type',
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
    ]
  }

  /**
   *
   */
  static get readonly() {
    return ['id', 'status', 'user_id', 'plan']
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
    this.addHook('beforeSave', async (instance) => {
      if (instance.dirty.plan && !isString(instance.dirty.plan)) {
        try {
          instance.plan = isArray(instance.dirty.plan) ? JSON.stringify(instance.dirty.plan) : null
        } catch (e) {}
      }
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
  rooms() {
    return this.hasMany('App/Models/Room')
  }

  /**
   *
   */
  addPlan(path) {
    this.plan = [...(isArray(this.plan) ? this.plan : []), path]
  }
}

module.exports = Estate
