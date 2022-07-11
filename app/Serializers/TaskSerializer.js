'use strict'

const BaseSerializer = require('./BaseSerializer')
const Drive = use('Drive')
const File = require('../Classes/File')

class TaskSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    return this._getRowJSON(item)
  }
}

module.exports = TaskSerializer
