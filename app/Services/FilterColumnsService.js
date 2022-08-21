'use strict'

const { STATUS_DELETE } = require("../constants")
const Database = use('Database')
const FilterColumns = use('App/Models/FilterColumns')

class FilterColumnsService {
  static async create(data) {
    return await FilterColumns.createItem({
      ...data
    })
  }

  static async update(id, data) {
    return await FilterColumns.query().where('id', id).update({ ...data })
  }

  static async delete(id) {
    return await FilterColumns.query().where('id', id).update({ 'status': STATUS_DELETE })
  }

  static async getAll(user_id, filter) {
    const query = FilterColumns.query()
      .select('filter_columns.*')
      .select(Database.raw('COALESCE(_fcp.order, 1) as real_order'), Database.raw('COALESCE(_fcp.visible, true) as visible'))
      .leftJoin({ '_fcp': 'filter_columns_preferences' }, function () {
        this.on('filter_columns.id', '_fcp.filter_columns_id').on('_fcp.user_id', user_id)
      })
      .whereNot('status', STATUS_DELETE)

    if (filter.filterName) {
      query.where('filterName', filter.filterName)
    }

    query.orderBy('real_order', 'desc')
    query.orderBy('id', 'asc')
    return (await query.fetch()).rows
  }

  static async get(id) {
    return await FilterColumns.query().where('id', id).whereNot('status', STATUS_DELETE).first()
  }
}

module.exports = FilterColumnsService