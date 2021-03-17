'use strict'

const Model = use('Model')

class Term extends Model {
  static get columns() {
    return [
      'id',
    ]
  }
}

module.exports = Term
