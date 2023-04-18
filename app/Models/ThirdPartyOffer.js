'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')
const Database = use('Database')
const { isString } = require('lodash')

class ThirdPartyOffer extends Model {
  static get columns() {
    return [
      'id',
      'source',
      'source_id',
      'coord',
      'coord_raw',
      'description',
      'url',
      'house_number',
      'street',
      'city',
      'zip',
      'country',
      'address',
      'floor',
      'number_floors',
      'bathrooms',
      'rooms_number',
      'area',
      'construction_year',
      'images',
      'energy_efficiency_class',
      'vacant_date',
      'visit_from',
      'visit_to',
      'amenities',
      'status',
      'expiration_date',
      'point_id',
      'net_rent',
      'contact',
      'full_address',
      'property_type',
      'vacant_from_string',
      'additional_costs',
      'heating_costs',
      'extra_costs',
      'house_type',
      'apt_type',
      'building_status',
      'available_end_at',
    ]
  }

  static boot() {
    super.boot()
    this.addHook('beforeSave', async (instance) => {
      if (instance.dirty.coord && isString(instance.dirty.coord)) {
        const [lat, lon] = instance.dirty.coord.split(',')
        instance.coord = Database.gis.setSRID(Database.gis.point(lon, lat), 4326)
      }
    })
  }

  point() {
    return this.hasOne('App/Models/Point', 'point_id', 'id')
  }

  likes() {
    return this.hasMany('App/Models/ThirdPartyOfferInteraction')
      .where('liked', true)
      .whereNot('knocked', true)
  }

  dislikes() {
    return this.hasMany('App/Models/ThirdPartyOfferInteraction')
      .where('liked', false)
      .whereNot('knocked', true)
  }

  knocks() {
    return this.hasMany('App/Models/ThirdPartyOfferInteraction').where('knocked', true)
  }

  static get Serializer() {
    return 'App/Serializers/ThirdPartyOfferSerializer'
  }
}

module.exports = ThirdPartyOffer
