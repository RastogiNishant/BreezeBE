'use strict'

const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class OptionSerializer extends BaseSerializer {
  mergeData(item) {
    return {
      id: item.id,
      title: item.title,
      type: item.type,
      order: item.order,
    }
  }
}

module.exports = OptionSerializer
