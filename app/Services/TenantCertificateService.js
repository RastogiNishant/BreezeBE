'use strict'
const File = use('App/Classes/File')
const Database = use('Database')
class TenantCertificateSerivce {
  static async addCertificate(request) {
    const count = File.filesCount(request, 'file')
    const trx = await Database.beginTransaction()
    try {
      const imageMimes = [
        File.IMAGE_JPEG,
        File.IMAGE_PNG,
        File.IMAGE_TIFF,
        File.IMAGE_WEBP,
        File.IMAGE_HEIC,
        File.IMAGE_GIF,
      ]
      const files = await File.saveRequestFiles(request, [{ field: 'file', mime: imageMimes }])

      if (files && files.file) {
        const paths = Array.isArray(files.file) ? files.file : [files.file]
        const original_file_names = Array.isArray(files.original_file)
          ? files.original_file
          : [files.original_file]
        const data = paths.map((path, index) => {
          return {
            disk: 's3public',
            url: path,
            file_name: original_file_names[index],
            room_id: room.id,
          }
        })
        const images = await this.addManyImages(data, trx)
        await require('./EstateService').updateCover(
          { room: room.toJSON(), addImage: images[0] },
          trx
        )
        //Event.fire('estate::update', room.estate_id)
        await trx.commit()
        return images
      } else {
        throw new HttpException(FAILED_TO_ADD_FILE, 400)
      }
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = TenantCertificateSerivce
