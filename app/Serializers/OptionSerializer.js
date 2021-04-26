'use strict'

const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class OptionSerializer extends BaseSerializer {
  mergeData(item) {
    return item.id
  }
}

module.exports = OptionSerializer
