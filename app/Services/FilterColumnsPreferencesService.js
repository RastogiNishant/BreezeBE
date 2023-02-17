'use strict'

const FilterColumnsService = use("App/Services/FilterColumnsService")
const FilterColumnsPreferences = use('App/Models/FilterColumnsPreferences')
const HttpException = use('App/Exceptions/HttpException')

class FilterColumnsPreferencesService {
  static async get(id) {
    return await FilterColumnsPreferences.query().where('id', id).first()
  }

  static async update(user_id, data) {

    if (!await FilterColumnsService.get(data.filter_columns_id)) {
      throw new HttpException('No column exists', 400)
    }

    const filterColumnsPreferences = await FilterColumnsPreferences.query()
      .where('user_id', user_id)
      .where('filter_columns_id', data.filter_columns_id).first()

    if (filterColumnsPreferences) {
      return await FilterColumnsPreferences.query()
        .where('filter_columns_id', data.filter_columns_id)
        .where('user_id', user_id).update({ ...data })
    } else {
      data.user_id = user_id
      return await FilterColumnsPreferences.createItem({ ...data })
    }
  }
}

module.exports = FilterColumnsPreferencesService