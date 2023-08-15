'use strict'
const Building = use('App/Models/Building')
const Promise = require('bluebird')
const HttpException = require('../Exceptions/HttpException')
const EstateFilters = require('../Classes/EstateFilters')
const Database = use('Database')
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

  static async getMatchBuilding({ user_id, limit = -1, from = -1, params = {} }) {
    let query = Building.query()
      .select(Database.raw(`DISTINCT(buildings.id)`))
      // .with('estates', function () {
      //   this.select('id')
      // })
      .select(
        Building.columns.filter((column) => column !== 'id').map((column) => `buildings.${column}`)
      )
      .select(Database.raw(`true as is_building`))
      .innerJoin({ estates: 'estates' }, function () {
        this.on('buildings.id', 'estates.build_id').on('estates.user_id', user_id)
      })

    const Filter = new EstateFilters(params, query)
    query = Filter.process()

    let buildings = []
    if (from !== -1 && limit != -1) {
      buildings = (await query.offset(from).limit(limit).fetch()).toJSON()
    } else {
      buildings = (await query.fetch()).toJSON()
    }

    const build_id = (buildings || []).map((building) => building.id)
    const estates = await require('./EstateService').getEstatesByUserId({
      user_ids: [user_id],
      params: { ...params, build_id },
    })

    buildings = buildings.map((building) => ({
      ...building,
      estates: (estates?.data || []).filter((estate) => estate.build_id === building.id),
    }))
    return buildings
  }
}

module.exports = BuildingService
