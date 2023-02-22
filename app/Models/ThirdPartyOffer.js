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
      'rent_start',
      'visit_from',
      'visit_to',
      'amenities',
      'status',
    ]
  }

  static boot() {
    super.boot()
    this.addHook('beforeSave', async (instance) => {
      console.log('beforeSave')
      if (instance.dirty.coord && isString(instance.dirty.coord)) {
        const [lat, lon] = instance.dirty.coord.split(',')
        instance.coord = Database.gis.setSRID(Database.gis.point(lon, lat), 4326)
      }
    })
  }
}

module.exports = ThirdPartyOffer
