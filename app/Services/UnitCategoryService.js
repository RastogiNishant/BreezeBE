'use strict'

const { omit } = require('lodash')
const UnitCategory = use('App/Models/UnitCategory')
const Promise = require('bluebird')

class UnitCategoryService {
  static async upsert(data) {
    if (await this.getCategoryByName({ build_id: data.build_id, name: data.name })) {
      return await this.update(data)
    }

    return await UnitCategory.createItem({ ...omit(data, ['building_id']) })
  }

  static async getCategoryByName({ build_id, name }) {
    return await UnitCategory.query().where('build_id', build_id).where('name', name).first()
  }

  static async update(data) {
    return await UnitCategory.query()
      .where('name', data.name)
      .where('build_id', data.build_id)
      .update({ ...omit(data, ['building_id']) })
  }

  static async bulkUpsert({ user_id, buildings, data }) {
    await Promise.map(
      data || [],
      async (category) => {
        const build_id = (buildings || []).filter(
          (building) =>
            building.user_id === user_id && building.building_id === category.building_id
        )?.[0]?.id
        if (build_id) {
          await UnitCategoryService.upsert({ ...category, build_id })
        }
      },
      { concurrency: 1 }
    )
  }

  static async getAll(build_id) {
    return (
      await UnitCategory.query()
        .whereIn('build_id', Array.isArray(build_id) ? build_id : [build_id])
        .fetch()
    ).toJSON()
  }

  static async getAllByQuery({ id }) {
    let query = UnitCategory.query()
    if (id) {
      query.whereIn('id', Array.isArray(id) ? id : [id])
    }

    return (await query.fetch()).toJSON()
  }
}

module.exports = UnitCategoryService
