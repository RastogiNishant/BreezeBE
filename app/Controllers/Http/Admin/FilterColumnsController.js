'use strict'

const FilterColumnsService = use('App/Services/FilterColumnsService')
const HttpException = use('App/Exceptions/HttpException')

class FilterColumnsController {

  async create({ request, auth, response }) {
    try {
      const { ...data } = request.all()
      response.res(await FilterColumnsService.create(data))
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async update({ request, response }) {
    try {
      const { id, ...data } = request.all()
      response.res(await FilterColumnsService.update(id, data))
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async delete({ request, response }) {
    try {
      const { id } = request.all()
      response.res(await FilterColumnsService.delete(id))
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async getAll({ request, auth, response }) {
    const { ...filter } = request.all()
    response.res(await FilterColumnsService.getAll(auth.user.id, filter))
  }
}

module.exports = FilterColumnsController