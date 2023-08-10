'use strict'
const BaseSerializer = require('./BaseSerializer')

class TenantCertificateSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    item = super.mergeData(item)

    item.attachments =
      typeof item?.attachments === 'string'
        ? JSON.parse(item?.attachments || [])
        : item?.attachments || []
    return item
  }
}

module.exports = TenantCertificateSerializer
