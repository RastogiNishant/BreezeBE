'use strict'

const Model = require('./BaseModel')

class Match extends Model {
  
  static get columns() {
    return ['estate_id', 'status', 'percentage']
  }

}

module.exports = Match
