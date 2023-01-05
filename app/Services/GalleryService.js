'use strict'

const HttpException = use('App/Exceptions/HttpException')
const Database = use('Database')
const BaseService = require('./BaseService')
const Gallery = use('App/Models/Gallery')
const FileBucket = use('App/Classes/File')
const {
  exceptions: { MEDIA_NOT_EXIST },
} = require('../excepions')
const {
  STATUS_DELETE,
  STATUS_ACTIVE,
  GALLERY_INSIDE_VIEW_TYPE,
  GALLERY_DOCUMENT_VIEW_TYPE,
  FILE_TYPE_PLAN,
  FILE_TYPE_CUSTOM,
  DOCUMENT_VIEW_ENERGY_TYPE,
} = require('../constants')

class GalleryService extends BaseService {
  static async addFile(request, user_id) {
    const files = await this.saveFiles(request, { isPublic: true })
    if (files && files.file) {
      const path = !Array.isArray(files.file) ? [files.file] : files.file
      const original_file_names = !Array.isArray(files.original_file)
        ? [files.original_file]
        : files.original_file
      const galleris = path.map((p, index) => {
        return { user_id, disk: 's3public', url: p, original_file_name: original_file_names[index] }
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
    FileBucket.remove(media.url)
    return true
  }

  static async getAll({ user_id, page = -1, limit = -1, ids = null }) {
    const query = Gallery.query().where('user_id', user_id).where('status', STATUS_ACTIVE)
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
    const { galleries } = await this.getAll({ user_id, ids: data.ids })
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
          break
        case GALLERY_DOCUMENT_VIEW_TYPE:
          switch (data.document_type) {
            case FILE_TYPE_PLAN:
              successGalleryIds = await require('./EstateService').addFileFromGallery(
                {
                  user_id,
                  estate_id,
                  type: FILE_TYPE_PLAN,
                  galleries: galleries.rows || [],
                },
                trx
              )
              break
            case FILE_TYPE_CUSTOM:
              successGalleryIds = await require('./EstateService').addFileFromGallery(
                {
                  user_id,
                  estate_id,
                  type: FILE_TYPE_CUSTOM,
                  galleries: galleries.rows || [],
                },
                trx
              )
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
              break
          }
          break
        default:
      }

      if (successGalleryIds) {
        await Gallery.query().whereIn('id', successGalleryIds).delete().transacting(trx)
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
