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
const FileModel = use('App/Models/File')
const Image = use('App/Models/Image')
const fsPromise = require('fs/promises')
const axios = require('axios')
const { isArray } = require('lodash')
const Database = use('Database')

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

  static async uploadOpenImmoImages(images, estateId) {
    const trx = await Database.beginTransaction()
    try {
      if (images && isArray(images)) {
        for (let image of images) {
          if (image.tmpPath && fs.existsSync(image.tmpPath)) {
            const fileExists = await FileModel.query()
              .where('estate_id', estateId)
              .where('file_name', image.file_name)
              .first()
            if (!fileExists) {
              const { filePathName } = await File.saveToDisk(image, [], true)
              await FileModel.createItem(
                {
                  url: filePathName,
                  type: image.type,
                  estate_id: estateId,
                  disk: 's3public',
                  file_name: image.file_name,
                  file_format: image.format,
                },
                trx
              )
            }
          }
        }
      }
      await trx.commit()
    } catch (err) {
      await trx.rollback()
      console.log(err.message)
    } finally {
      for (let image of images) {
        if (image.tmpPath && fs.existsSync(image.tmpPath)) {
          await fsPromise.unlink(image.tmpPath)
        }
      }
    }
  }

  static async savePropertyBulkImages(images) {
    for (let image of images) {
      if (image && image.photos && image.photos.length) {
        image.photos.map((p) => {
          ImageService.savePropertyImage(p, image.room_id)
        })
      }
    }
  }

  static async savePropertyImage(imagePath, roomId) {
    fs.readFile(imagePath, async function (err, data) {
      if (err) throw err // Fail if the file can't be read.
      try {
        const ext = ContentType.getExt(imagePath)
        const image = {
          tmpPath: imagePath,
          header: {
            'content-type': ContentType.getContentType(ext),
          },
        }
        const { filePathName } = await File.saveToDisk(image, [], true)
        await Image.createItem({
          url: filePathName,
          room_id: roomId,
          disk: 's3public',
        })
      } catch (e) {
        console.log(e)
      }
    })
  }

  static async getImagesByRoom(roomId, imageIds) {
    return await Image.query()
      .select('images.*')
      .whereIn('images.id', imageIds)
      .orderBy('order', 'asc')
      .orderBy('id', 'asc')
      .innerJoin({ _r: 'rooms' }, function () {
        this.on('_r.id', 'images.room_id').onIn('_r.id', roomId)
      })
      .fetch()
  }

  static async updateOrder(ids, trx = null) {
    await Promise.all(
      ids.map(async (id, index) => {
        await Image.query()
          .where('id', id)
          .update({ order: index + 1 })
          .transacting(trx)
      })
    )
  }

  static async getAll() {
    return (await Image.query().fetch()).rows
    //return (await Image.query().paginate(1, 469)).rows
    // const image = await Image.query().where('id', 558).first()
    // return [image]
  }

  static async createThumbnail() {
    const images = await ImageService.getAll()
    await Promise.all(
      images.map(async (image) => {
        {
          try {
            const url = File.getPublicUrl(image.url)
            if (image.url) {
              const url_strs = image.url.split('/')
              if (url_strs.length === 2) {
                const fileName = url_strs[1]
                const isValidFormat = File.SUPPORTED_IMAGE_FORMAT.some((format) => {
                  return fileName.includes(format)
                })

                if (isValidFormat) {
                  const mime = File.SUPPORTED_IMAGE_FORMAT.find((mt) => fileName.includes(mt))
                  const options = { ContentType: File.IMAGE_MIME_TYPE[mime] }
                  if (image.disk === 's3public') {
                    options.ACL = 'public-read'
                  }

                  await File.saveThumbnailToDisk({
                    image: url,
                    fileName: fileName,
                    dir: `${url_strs[0]}`,
                    options,
                    disk: image.disk || 's3public',
                    isUri: true,
                  })
                }
              }
            }
          } catch (e) {
            console.log('Creating thumbnail Error', e)
            throw new HttpException('Creating thumbnail HttpException Error', e)
          }
        }
      })
    )
    console.log('End creating estates thumbnail')
  }

  static async saveFunctionalTestImage(url) {
    try {
      const TEMP_PATH = process.env.PDF_TEMP_DIR || '/tmp'
      const outputFileName = `${TEMP_PATH}/output_${uuid.v4()}.jpg`

      const writeFunctionalTestImage = async () => {
        const writer = fs.createWriteStream(outputFileName)
        const response = await axios.get(url, { responseType: 'arraybuffer' })
        return new Promise((resolve, reject) => {
          if (response.data instanceof Buffer) {
            writer.write(response.data)
            resolve(outputFileName)
          } else {
            response.data.pipe(writer)
            let error = null
            writer.on('error', (err) => {
              error = err
              writer.close()
              reject(err)
            })
            writer.on('close', () => {
              if (!error) {
                resolve(outputFileName)
              }
            })
          }
        })
      }

      await writeFunctionalTestImage(outputFileName)
      return outputFileName
    } catch (e) {
      return null
      console.log('saveFunctionalTestImage Error', e.message)
    }
  }
}

module.exports = ImageService
