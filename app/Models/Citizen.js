'use strict'

const Model = require('./BaseModel')

class Citizen extends Model {
  static get columns() {
    return ['id', 'citizen_key', 'en_name', 'de_name', 'created_at', 'updated_at']
  }
}

module.exports = Citizen
