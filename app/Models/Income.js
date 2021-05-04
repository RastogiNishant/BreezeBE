'use strict'

const Model = use('Model')

class Income extends Model {
  static get columns() {
    return ['id', 'member_id', 'url', 'disk']
  }

  static get readonly() {
    return ['id', 'member_id']
  }

  static get traits() {
    return ['NoTimestamp']
  }
}

module.exports = Income
