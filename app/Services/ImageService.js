'use strict'

const sharp = require('sharp')
const fs = require('fs')
const Drive = use('Drive')
const uuid = require('uuid')
const Helpers = use('Helpers')
const Config = use('Config')
const moment = require('moment')
const ContentType = use('App/Classes/ContentType')
const File = use('App/Classes/File')
const Image = use('App/Models/Image')

class ImageService {
  /**
   * Save image to DB
   */

  static async resizeAvatar(fileStream, filename) {
    const { width, height } = Config.get('app.images.avatar')
    const roundedCornerResize = sharp().rotate().resize(width, height).png()

    const resizeFile = (file, filename) =>
      new Promise((resolve, reject) => {
        const writableStream = fs.createWriteStream(filename)
        file.stream.pipe(roundedCornerResize).pipe(writableStream)
        writableStream.on('finish', () => {
          resolve()
        })
        writableStream.on('error', (e) => {
          reject(e)
        })
      })

    const dest = Helpers.tmpPath(filename)
    await resizeFile(fileStream, dest)

    return dest
  }

  static async savePropertyBulkImages( images ) {
    for( let image of images ) {
      if( image && image.photos && image.photos.length ) {
        image.photos.map( p => {
          ImageService.savePropertyImage(p, image.room_id);
        })
      }
    }
  }
  static async savePropertyImage(imagePath, roomId ) {

    const filePathName = fs.readFile( imagePath, async function(err, data) {
      if (err) throw err; // Fail if the file can't be read.
      try{
        const ext = ContentType.getExt(imagePath);
        const filename = `${uuid.v4()}`
        const filePathName = `${moment().format('YYYYMM')}/${filename}.${ext}`

        await Drive.disk('s3public').put(filePathName, data, {
          ACL: 'public-read',
          ContentType: ContentType.getContentType(ext),
        })

        await Image.createItem({
          url:filePathName,
          room_id: roomId,
          disk:'s3public'
        })
      }catch(e) {
        console.log(e);
      }
      return filePathName;
    });
  }
}

module.exports = ImageService
