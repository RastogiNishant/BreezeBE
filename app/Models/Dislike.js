'use strict'
const Model = require('./BaseModel')
class Dislike extends Model {
  static get columns() {
    return ['user_id', 'estate_id', 'created_at']
  }
}

module.exports = Dislike
