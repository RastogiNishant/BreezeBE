'use strict'

const HttpException = use('App/Exceptions/HttpException')
const Database = use('Database')
const BaseService = require('./BaseService')
const File = use('App/Models/File')
const FileBucket = use('App/Classes/File')
const Promise = require('bluebird')
const {
  exceptions: { MEDIA_NOT_EXIST },
} = require('../exceptions')
const {
  STATUS_DELETE,
  STATUS_ACTIVE,
  GALLERY_INSIDE_VIEW_TYPE,
  GALLERY_DOCUMENT_VIEW_TYPE,
  FILE_TYPE_PLAN,
  FILE_TYPE_CUSTOM,
  DOCUMENT_VIEW_ENERGY_TYPE,
  FILE_TYPE_GALLERY,
  FILE_TYPE_IMAGE,
} = require('../constants')

class GalleryService extends BaseService {
  static async addFile(request, user_id) {
    const { estate_id } = request.all()
    const files = await this.saveFiles(request, { isPublic: true })
    if (files && files.file) {
      const path = !Array.isArray(files.file) ? [files.file] : files.file
      const file_names = !Array.isArray(files.original_file)
        ? [files.original_file]
        : files.original_file
      const galleries = path.map((p, index) => {
        return {
          disk: 's3public',
          estate_id,
          url: p,
          file_name: file_names[index],
          type: FILE_TYPE_GALLERY,
        }
      })

      return await File.createMany(galleries)
    }
    return null
  }

  static async addFromView({ estate_id, url, file_name = null }, trx) {
    const file = {
      url,
      file_name,
      estate_id,
      type: FILE_TYPE_GALLERY,
      disk: 's3public',
    }

    await File.createItem(file, trx)
  }

  static async getById(id, user_id) {
    return await File.query()
      .where('id', id)
      .where('status', STATUS_ACTIVE)
      .where('type', FILE_TYPE_GALLERY)
      .where('user_id', user_id)
      .first()
  }

  static async removeFile({ estate_id, ids }, trx = null) {
    const { galleries } = await this.getAll({ ids, estate_id })

    if (!galleries || galleries.rows?.length !== ids.length) {
      throw new HttpException(MEDIA_NOT_EXIST, 400)
    }

    if (!trx) {
      await File.query().whereIn('id', ids).delete()
    } else {
      await File.query().whereIn('id', ids).delete().transacting(trx)
    }
    try {
      Promise.map(galleries.rows || [], (gallery) => FileBucket.remove(gallery.url))
    } catch (e) {}
    return true
  }

  static async getAll({ estate_id, page = -1, limit = -1, ids = null }) {
    const query = File.query().where('estate_id', estate_id).where('type', FILE_TYPE_GALLERY)
    let galleries, count

    if (ids) {
      ids = Array.isArray(ids) ? ids : [ids]
      query.whereIn('id', ids)
    }
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

  static async assign({ user_id, estate_id, data }) {
    const { galleries } = await this.getAll({ estate_id, ids: data.ids })
    let successGalleryIds = null

    const trx = await Database.beginTransaction()
    try {
      switch (data.view_type) {
        case GALLERY_INSIDE_VIEW_TYPE:
          successGalleryIds = await require('./RoomService').addImageFromGallery(
            {
              user_id,
              room_id: data.room_id,
              estate_id,
              galleries: galleries.rows || [],
            },
            trx
          )
          await this.removeFile({ estate_id, ids: data.ids }, trx)
          break
        case GALLERY_DOCUMENT_VIEW_TYPE:
          switch (data.document_type) {
            case FILE_TYPE_PLAN:
            case FILE_TYPE_CUSTOM:
            case FILE_TYPE_IMAGE:
              await require('./EstateService').restoreFromGallery(
                {
                  ids: data.ids,
                  estate_id,
                  type: data.document_type,
                  user_id,
                },
                trx
              )
              break
          }
          break
        case DOCUMENT_VIEW_ENERGY_TYPE:
          successGalleryIds = await require('./EstateService').updateEnergyProofFromGallery(
            {
              user_id,
              estate_id,
              galleries: galleries.rows || [],
            },
            trx
          )
          await this.removeFile({ estate_id, ids: data.ids }, trx)
          break
        default:
      }

      await trx.commit()
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400)
    }

    return successGalleryIds
  }
}

module.exports = GalleryService
