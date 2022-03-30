'use strict'

const Model = require('./BaseModel')

class Term extends Model {
  static get columns() {
    return ['id', 'status', 'title', 'body', 'title_de', 'body_de']
  }
}

module.exports = Term
