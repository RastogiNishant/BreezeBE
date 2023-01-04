'use strict'

const GalleryService = use('App/Services/GalleryService')
const HttpException = use('App/Exceptions/HttpException')

class GalleryController {
  async addFile({ request, auth, response }) {
    try {
      response.res(await GalleryService.addFile(request, auth.user.id))
    } catch (e) {
      throw new HttpException(e.message, e.status || 400)
    }
  }

  async removeFile({ request, auth, response }) {
    const { id } = request.all()
    try {
      response.res(await GalleryService.removeFile({ user_id: auth.user.id, id }))
    } catch (e) {
      throw new HttpException(e.message, e.status || 400)
    }
  }

  async getAll({ request, auth, response }) {
    const { page, limit } = request.all()
    response.res(await GalleryService.getAll({ user_id: auth.user.id, page, limit }))
  }
}

module.exports = GalleryController
