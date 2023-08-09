'use strict'
const File = use('App/Classes/File')
const TenantCertificate = use('App/Models/TenantCertificate')
const HttpException = use('App/Exceptions/HttpException')
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
        const data = paths.map((path, index) => {
          return {
            user_id,
            city_id,
            income_level,
            expired_at,
            disk: 's3',
            uri: path,
            file_name: original_file_names[index],
          }
        })
        console.log('certificates data=', data)
        const certificates = await TenantCertificate.createMany(data)
        //Event.fire('estate::update', room.estate_id)
        return certificates
      } else {
        throw new HttpException(FAILED_TO_ADD_FILE, 400)
      }
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = TenantCertificateSerivce
