'use strict'

const BaseSerializer = require('./BaseSerializer')
const Drive = use('Drive')
const File = require('../Classes/File')
const moment = require('moment')

class TaskSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    item = this._getRowJSON(item)
    if (item.created_at) {
      item.created_at = moment.utc(item.created_at).format()
    }
    if (item.updated_at) {
      item.updated_at = moment.utc(item.updated_at).format()
    }
    return item
  }
}

module.exports = TaskSerializer
