'use strict'

const sharp = require('sharp')
const fs = require('fs')

const Helpers = use('Helpers')
const Config = use('Config')

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
}

module.exports = ImageService
