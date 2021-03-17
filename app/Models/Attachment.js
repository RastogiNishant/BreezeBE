'use strict'

const Model = use('Model')

class Attachment extends Model {
  static get columns() {
    return [
      'id',
    ]
  }
}

module.exports = Attachment
