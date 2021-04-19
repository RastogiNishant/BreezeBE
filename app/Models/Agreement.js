'use strict'

const Model = require('./BaseModel')

class Agreement extends Model {
  static get columns() {
    return ['id', 'status', 'title', 'body']
  }
}

module.exports = Agreement
