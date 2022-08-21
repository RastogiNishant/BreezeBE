'use strict'

const FilterColumnsPreferencesService = use('App/Services/FilterColumnsPreferencesService')
const HttpException = use('App/Exceptions/HttpException')

class FilterColumnsPreferencesController {
  async update({ request, auth, response }) {
    try {
      const { ...data } = request.all()
      response.res(await FilterColumnsPreferencesService.update(auth.user.id, data))
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = FilterColumnsPreferencesController