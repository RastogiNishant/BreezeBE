'use strict'
const File = use('App/Classes/File')
const TenantCertificate = use('App/Models/TenantCertificate')
const TenantService = use('App/Services/TenantService')
const HttpException = use('App/Exceptions/HttpException')
const { STATUS_DELETE } = require('../constants')
const Database = use('Database')
const {
  exceptions: { FAILED_TO_ADD_FILE },
} = require('../exceptions')
class TenantCertificateSerivce {
  static async addCertificate(request, user_id) {
    const { city_id, income_level, expired_at } = request.all()
    const trx = await Database.beginTransaction()
    try {
      const imageMimes = [
        File.IMAGE_JPEG,
        File.IMAGE_PNG,
        File.IMAGE_TIFF,
        File.IMAGE_WEBP,
        File.IMAGE_HEIC,
        File.IMAGE_GIF,
        File.IMAGE_PDF,
      ]

      const files = await File.saveRequestFiles(request, [
        { field: 'file', mime: imageMimes, isPublic: false },
      ])

      if (files && files.file) {
        const paths = Array.isArray(files.file) ? files.file : [files.file]
        const original_file_names = Array.isArray(files.original_file)
          ? files.original_file
          : [files.original_file]
        const attachments = paths.map((path, index) => ({
          disk: 's3',
          uri: path,
          file_name: original_file_names[index],
        }))
        await TenantService.requestCertificate(
          {
            user_id,
            request_certificate_at: null,
            request_certificate_city_id: null,
          },
          trx
        )
        const certificate = await TenantCertificate.createItem(
          {
            user_id,
            city_id,
            income_level,
            expired_at,
            attachments: JSON.stringify(attachments),
          },
          trx
        )

        await trx.commit()
        return certificate
      } else {
        throw new HttpException(FAILED_TO_ADD_FILE, 400)
      }
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  static async updateImage(request, user_id) {
    const { id } = request.all()
    const tenantCertificate = await this.get(id)

    const imageMimes = [
      File.IMAGE_JPEG,
      File.IMAGE_PNG,
      File.IMAGE_TIFF,
      File.IMAGE_WEBP,
      File.IMAGE_HEIC,
      File.IMAGE_GIF,
      File.IMAGE_PDF,
    ]

    const files = await File.saveRequestFiles(request, [
      { field: 'file', mime: imageMimes, isPublic: false },
    ])

    if (files && files.file) {
      const paths = Array.isArray(files.file) ? files.file : [files.file]
      const original_file_names = Array.isArray(files.original_file)
        ? files.original_file
        : [files.original_file]
      const attachments = [
        ...(tenantCertificate.attachments || []),
        ...paths.map((path, index) => ({
          disk: 's3',
          uri: path,
          file_name: original_file_names[index],
        })),
      ]

      await TenantCertificate.query()
        .where('id', id)
        .where('user_id', user_id)
        .update({ attachments: JSON.stringify(attachments) })

      return { ...tenantCertificate.toJSON(), attachments }
    } else {
      throw new HttpException(FAILED_TO_ADD_FILE, 400)
    }
  }

  static async updateCertificate(data) {
    await TenantCertificate.query()
      .where('id', data.id)
      .where('user_id', data.user_id)
      .update({ ...data })

    return await TenantCertificate.query().where('id', data.id).first()
  }

  static async deleteCertificate({ id, user_id }, trx) {
    try {
      const query = TenantCertificate.query()
      if (id) {
        query.where('id', id)
      }

      return await query
        .where('user_id', user_id)
        .update({ status: STATUS_DELETE })
        .transacting(trx)
    } catch (e) {
      throw new HttpException(e.message, e.status || 400)
    }
  }

  static async getAll(user_id) {
    return await TenantCertificate.query()
      .where('user_id', user_id)
      .whereNot('status', STATUS_DELETE)
      .fetch()
  }

  static async get(id) {
    return await TenantCertificate.query()
      .where('id', id)
      .whereNot('status', STATUS_DELETE)
      .firstOrFail()
  }
}

module.exports = TenantCertificateSerivce
