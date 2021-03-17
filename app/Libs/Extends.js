'use strict'

const { each, toString } = require('lodash')
const { getUrl } = require('./utils.js')

/**
 * Add custom validation methods
 */
const extendsValidator = () => {
  // const Validator = use('Validator')
}

/**
 * Add custom macro for Request class
 */
const extendsRequest = () => {
  const Request = use('Adonis/Src/Request')
  const Drive = use('Drive')
  const AppException = use('App/Exceptions/AppException')

  // IMPORTANT: should be disabled request auto bodyParse (processManually: config/bodyParser.js)
  Request.macro('uploadImagesS3', async function (files) {
    const fileSettings = {
      types: ['image', 'video'],
      size: '50mb',
    }

    let resultFiles = {}
    each(files, (fileName, requestVarName) => {
      this.multipart.file(requestVarName, fileSettings, async (file) => {
        let fileNameBlocks = fileName.split('.')
        if (fileNameBlocks.length > 1) {
          // Replace file ext to origin
          fileNameBlocks[fileNameBlocks.length - 1] = toString(file.extname).toLowerCase()
        } else {
          // Add origin file ext
          fileNameBlocks.push(toString(file.extname).toLowerCase())
        }
        fileName = fileNameBlocks.join('.')
        resultFiles[requestVarName] = await Drive.disk('s3').put(fileName, file.stream, {
          ACL: 'public-read',
          ContentType: file.headers['content-type'],
        })
      })
    })

    try {
      await this.multipart.process()
    } catch (e) {
      throw new AppException(e.message)
    }

    return resultFiles
  })
}

/**
 *
 */
const extendsResponse = () => {
  const Response = use('Adonis/Src/Response')

  Response.macro('notFound', function () {
    return this.status(404).json({ error: 'Item not found' })
  })

  Response.macro('res', function (data) {
    return this.json({
      status: 'success',
      data,
    })
  })
}

/**
 * Add function to View template
 */
const extendsView = () => {
  const View = use('View')

  View.global('getUrl', function (path, data = {}) {
    return getUrl(path, data)
  })
}

module.exports = {
  extendsValidator,
  extendsRequest,
  extendsResponse,
  extendsView,
}
