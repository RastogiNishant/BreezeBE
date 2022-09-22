'use strict'

const BaseSerializer = require('./BaseSerializer')
const File = use('App/Classes/File')

class LetterTemplateSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    if (item.logo) {
      if (item.logo.search('http') !== 0) {
        item.logo_thumb =
          item.logo.split('/').length === 2
            ? File.getPublicUrl(
                `thumbnail/${item.logo.split('/')[0]}/thumb_${item.logo.split('/')[1]}`
              )
            : ''
        item.logo = File.getPublicUrl(item.logo)
      }
    }

    return this._getRowJSON(item)
  }
}

module.exports = LetterTemplateSerializer
