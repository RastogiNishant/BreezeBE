'use strict'

const Drive = use('Drive')

const BaseSerializer = require('./BaseSerializer')
const File = require('../Classes/File')
/**
 *
 */
class FileSerializer extends BaseSerializer {
  mergeData(item) {
    const { id, url, disk, type, file_name, order } = item
    const thumb =
      url && url.split('/').length === 2
        ? File.getPublicUrl(`thumbnail/${url.split('/')[0]}/thumb_${url.split('/')[1]}`)
        : ''

    return {
      id,
      url: Drive.disk(disk).getUrl(url),
      type,
      order,
      file_name,
      relativeUrl: url,
      thumb,
    }
  }
}

module.exports = FileSerializer
