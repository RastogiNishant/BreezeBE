'use strict'

const Model = require('./BaseModel')

class Like extends Model {
  static get columns() {
    return ['estate_id', 'user_id']
  }
}

module.exports = Like
