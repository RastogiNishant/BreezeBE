'use strict'

const Drive = use('Drive')
const File = require('../Classes/File')
const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class GallerySerializer extends BaseSerializer {
  mergeData(item) {
    const { id, user_id, original_file_name, url, disk, status } = item
    const thumb =
      url && url.split('/').length === 2
        ? File.getPublicUrl(`thumbnail/${url.split('/')[0]}/thumb_${url.split('/')[1]}`)
        : ''
    return {
      id,
      user_id,
      original_file_name,
      status,
      url: Drive.disk(disk).getUrl(url),
      relativeUrl: url,
      thumb,
    }
  }
}

module.exports = GallerySerializer
