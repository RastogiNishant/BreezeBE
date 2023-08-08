'use strict'

const Building = use('App/Models/Building')
const Promise = require('bluebird')
const HttpException = require('../Exceptions/HttpException')
const {
  exceptions: { NO_BUILDING_ID_EXIST },
} = require('../exceptions')
class BuildingService {
  static async upsert({ user_id, data }) {
    if (!data.building_id) {
      throw new HttpException(NO_BUILDING_ID_EXIST, 400)
    }

    if (await this.getByBuildingId({ user_id, building_id: data.building_id })) {
      return await this.update({ user_id, data })
    }

    return await Building.createItem({ ...data, user_id })
  }

  static async update({ user_id, data }) {
    return await Building.query()
      .where('user_id', user_id)
      .where('building_id', data.building_id)
      .update({ ...data })
  }

  static async delete({ id, user_id }) {
    return await Building.query().where('id', id).where('user_id', user_id).delete()
  }

  static async get({ id, user_id }) {
    return await Building.query().where('id', id).where('user_id', user_id).first()
  }

  static async getByBuildingId({ user_id, building_id }) {
    return await Building.query()
      .where('building_id', building_id)
      .where('user_id', user_id)
      .first()
  }

  static async getAll(user_id) {
    return (await Building.query().where('user_id', user_id).fetch()).toJSON()
  }

  static async bulkUpsert(user_id, data) {
    await Promise.map(
      data || [],
      async (building) => {
        await BuildingService.upsert({ user_id, data: building })
      },
      { concurrency: 1 }
    )
  }
}

module.exports = BuildingService
