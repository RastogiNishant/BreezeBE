'use strict'

const Model = use('Model')

class Agreement extends Model {
  static get columns() {
    return [
      'id',
    ]
  }
}

module.exports = Agreement
