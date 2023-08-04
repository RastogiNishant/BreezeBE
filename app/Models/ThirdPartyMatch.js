'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')
const Database = use('Database')

class ThirdPartyMatch extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'estate_id',
      'percent',
      'status',
      'created_at',
      'updated_at',
      'prospect_score',
      'landlord_score',
    ]
  }
}

module.exports = ThirdPartyMatch
