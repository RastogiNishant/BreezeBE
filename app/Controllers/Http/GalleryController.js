'use strict'

const GalleryService = use('App/Services/GalleryService')
const HttpException = use('App/Exceptions/HttpException')

class GalleryController {
  async removeFile({ request, auth, response }) {
    const { id, estate_id } = request.all()
    try {
      response.res(await GalleryService.removeFile({ estate_id, ids: [id] }))
    } catch (e) {
      throw new HttpException(e.message, e.status || 400)
    }
  }

  async getAll({ request, auth, response }) {
    const { id, page, limit } = request.all()
    response.res(await GalleryService.getAll({ estate_id: id, user_id: auth.user.id, page, limit }))
  }

  async assign({ request, auth, response }) {
    const { estate_id, ...data } = request.all()
    response.res(await GalleryService.assign({ user: auth.user, estate_id, data }))
  }
}

module.exports = GalleryController
