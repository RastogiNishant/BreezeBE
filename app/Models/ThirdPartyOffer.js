'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')

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
    ]
  }
}

module.exports = ThirdPartyOffer
