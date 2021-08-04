'use strict'

const { isString } = require('lodash')

const BaseSerializer = require('./BaseSerializer')
const NotificationsService = use('App/Services/NotificationsService')

/**
 *
 */
class NoticeSerializer extends BaseSerializer {
  mergeData(item) {
    item.type = NotificationsService.getTypeById(item.type)
    item.updated_at = undefined
    return this._getRowJSON(item)
  }
}

module.exports = NoticeSerializer
