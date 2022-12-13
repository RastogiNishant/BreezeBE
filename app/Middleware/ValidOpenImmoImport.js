'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class ValidOpenImmoImport {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request }, next) {
    // call next to advance the request
    const importFile = request.file('file')
    if (
      !(
        importFile.headers['content-type'] === 'application/xml' ||
        importFile.headers['content-type'] === 'application/zip'
      )
    ) {
      throw new HttpException('Invalid Openimmo file')
    }
    request.importFile = importFile
    await next()
  }
}

module.exports = ValidOpenImmoImport
