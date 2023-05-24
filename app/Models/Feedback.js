'use strict'
const Model = require('./BaseModel')

class Feedback extends Model {
  static get columns() {
    return ['id', 'user_id', 'point', 'description', 'device']
  }
}

module.exports = Feedback
