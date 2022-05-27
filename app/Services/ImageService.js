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

    fs.readFile( imagePath, async function(err, data) {
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
    });
  }
  static async getImageIds( roomId, imageIds) {
    return (await Image.query()
      .select('images.id')
      .whereIn('images.id', imageIds)
      .innerJoin({ _r: 'rooms' }, function () {
        this.on('_r.id', 'images.room_id').onIn('_r.id', roomId)          
      })
      .fetch()).rows
  }

  static async updateOrder( ids ) {
    await Promise.all(
      ids.map(async(id, index) => {
        await Image.query()
        .where('id', id)
        .update({order:index+1})
      })
    )
  }
}

module.exports = ImageService
