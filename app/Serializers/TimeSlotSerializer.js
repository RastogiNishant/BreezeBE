'use strict'

const BaseSerializer = require('./BaseSerializer')
const Drive = use('Drive')
const File = require('../Classes/File')
const moment = require('moment')

class TimeSlotSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    item = this._getRowJSON(item)
    if (item.start_at) {
      item.start_at = moment.utc(item.start_at).format()
    }
    if (item.end_at) {
      item.end_at = moment.utc(item.end_at).format()
    }
    if (item.prev_start_at) {
      item.prev_start_at = moment.utc(item.prev_start_at).format()
    }
    if (item.prev_end_at) {
      item.prev_end_at = moment.utc(item.prev_end_at).format()
    }
    return item
  }
}

module.exports = TimeSlotSerializer
