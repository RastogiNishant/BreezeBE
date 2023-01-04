'use strict'

const HttpException = use('App/Exceptions/HttpException')
const BaseService = require('./BaseService')
const Gallery = use('App/Models/Gallery')

const {
  exceptions: { MEDIA_NOT_EXIST },
} = require('../excepions')
const { STATUS_DELETE, STATUS_ACTIVE } = require('../constants')

class GalleryService extends BaseService {
  static async addFile(request, user_id) {
    const files = await this.saveFiles(request, { isPublic: true })
    if (files && files.file) {
      const path = !Array.isArray(files.file) ? [files.file] : files.file
      const galleris = path.map((p) => {
        return { user_id, disk: 's3public', url: p }
      })
      return await Gallery.createMany(galleris)
    }
    return null
  }

  static async getById(id, user_id) {
    return await Gallery.query()
      .where('id', id)
      .where('status', STATUS_ACTIVE)
      .where('user_id', user_id)
      .first()
  }

  static async removeFile({ user_id, id }) {
    const media = await this.getById(id, user_id)
    if (!media) {
      throw new HttpException(MEDIA_NOT_EXIST, 400)
    }

    await Gallery.query().where('id', id).update({ status: STATUS_DELETE })
    return true
  }

  static async getAll({ user_id, page = -1, limit = -1 }) {
    const query = Gallery.query().where('user_id', user_id).where('status', STATUS_ACTIVE)
    let galleries, count
    if (page === -1 || limit === -1) {
      galleries = await query.fetch()
      count = galleries.rows.length
    } else {
      galleries = await query.paginate(page, limit)
      count = galleries.pages.total
    }

    return {
      galleries,
      count,
    }
  }
}

module.exports = GalleryService
