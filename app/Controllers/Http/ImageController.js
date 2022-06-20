'use strict'

const HttpException = require('../../Exceptions/HttpException')
const Drive = use('Drive')
const uuid = require('uuid')
const moment = require('moment')
const imageThumbnail = require('image-thumbnail')
const QueueService = use('App/Services/QueueService')
const File = use('App/Classes/File')
class ImageController {
  async compressImage({ request, response }) {
    //response.res(true)
    try {
      const image = request.file('file', {
        size: process.env.MAX_IMAGE_SIZE || '20M',
        extnames: File.SUPPORTED_IMAGE_FORMAT,
      })

      if (image.hasErrors) {
        throw new HttpException(image.errors, 400)
      }

      const imagemin = (await import('imagemin')).default
      const imageminMozjpeg = (await import('imagemin-mozjpeg')).default
      const imageminPngquant = require('imagemin-pngquant')

      let img_data = Drive.getStream(image.tmpPath)
      if (image.size > 10000) {
        // image size is bigger than 2M, it's only for test, we need to change it later
        img_data = (
          await imagemin([image.tmpPath], {
            plugins: [imageminPngquant({ quality: [0.6, 0.8] }), imageminMozjpeg({ quality: 80 })],
          })
        )[0].data
      }

      const ext = image.extname
        ? image.extname
        : image.clientName.toLowerCase().replace(/.*(jpeg|jpg|png|pdf)$/, '$1')

      const compressFilePathName = `${moment().format('YYYYMM')}/${uuid.v4()}.${ext}`
      await Drive.disk('s3public').put(compressFilePathName, img_data, {
        ACL: 'public-read',
        ContentType: image.headers['content-type'],
      })

      // const originalFilePathName = `${moment().format('YYYYMM')}/${uuid.v4()}.${ext}`
      // await Drive.disk('s3public').put(originalFilePathName, Drive.getStream(image.tmpPath), {
      //   ACL: 'public-read',
      //   ContentType: image.headers['content-type'],
      // })
      const thumbnail = await this.createThumbnailImage(img_data)
      const thumbnailFilePathName = `${moment().format('YYYYMM')}/${uuid.v4()}.${ext}`

      await Drive.disk('s3public').put(thumbnailFilePathName, thumbnail, {
        ACL: 'public-read',
        ContentType: image.headers['content-type'],
      })

      const ret = {
        // origin: Drive.disk('s3public').getUrl(originalFilePathName),
        compress: Drive.disk('s3public').getUrl(compressFilePathName),
        thumbnail: Drive.disk('s3public').getUrl(thumbnailFilePathName),
      }
      response.res(ret)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async createThumbnailImage(buffer) {
    const options = { width: 300, jpegOptions: { force: true, quality: 100 } }
    const thumbnail = await imageThumbnail(buffer, options)
    return thumbnail
  }

  /** Don't use this endpoint often. it's just for one time creating thumbnail for each server */
  async tryCreateThumbnail({ request, response }) {
    QueueService.creatThumbnail()
  }
}

module.exports = ImageController
