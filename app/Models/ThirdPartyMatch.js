'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')
const Database = use('Database')

class ThirdPartyMatch extends Model {
  static get columns() {
    return ['id', 'user_id', 'status', 'estate_id', 'created_at', 'updated_at']
  }
}

module.exports = ThirdPartyMatch
