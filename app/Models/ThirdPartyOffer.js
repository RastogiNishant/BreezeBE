'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')
const Database = use('Database')
const { isString } = require('lodash')

class ThirdPartyOffer extends Model {
  static get columns() {
    return [
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
      'floor_count',
      'bathrooms',
      'rooms',
      'area',
      'construction_year',
      'images',
      'energy_efficiency_class',
      'vacant_from',
      'visit_from',
      'visit_to',
      'amenities',
      'status',
      'expiration_date',
      'point_id',
      'price',
      'contact',
      'full_address',
      'property_type',
      'vacant_from_string',
      'additional_costs',
      'heating_costs',
      'extra_costs',
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

  static get Serializer() {
    return 'App/Serializers/ThirdPartyOfferSerializer'
  }
}

module.exports = ThirdPartyOffer
