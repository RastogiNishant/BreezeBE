'use strict'
const File = use('App/Classes/File')
const TenantCertificate = use('App/Models/TenantCertificate')
const HttpException = use('App/Exceptions/HttpException')
const { STATUS_DELETE } = require('../constants')
const Database = use('Database')
const {
  exceptions: { FAILED_TO_ADD_FILE },
} = require('../exceptions')
class TenantCertificateSerivce {
  static async addCertificate(request, user_id) {
    const { city_id, income_level, expired_at } = request.all()
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

        const certificate = await TenantCertificate.create({
          user_id,
          city_id,
          income_level,
          expired_at,
          attachments: JSON.stringify(attachments),
        })
        return certificate
      } else {
        throw new HttpException(FAILED_TO_ADD_FILE, 400)
      }
    } catch (e) {
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
        ...paths.map((path, index) => {
          return {
            disk: 's3',
            uri: path,
            file_name: original_file_names[index],
          }
        }),
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

  static async deleteCertificate({ id, user_id }) {
    const trx = await Database.beginTransaction()
    try {
      //TODO: Remove request certificate

      return await TenantCertificate.query()
        .where('id', id)
        .where('user_id', user_id)
        .update({ status: STATUS_DELETE })
        .transacting(trx)
    } catch (e) {}
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
