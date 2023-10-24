'use strict'
const { toLower, isNull } = require('lodash')
const Building = use('App/Models/Building')
const Promise = require('bluebird')
const HttpException = require('../Exceptions/HttpException')
const EstateFilters = require('../Classes/EstateFilters')
const Filter = require('../Classes/Filter')
const Database = use('Database')
const {
  exceptions: { NO_BUILDING_ID_EXIST }
} = require('../exceptions')
const { PUBLISH_STATUS_INIT, STATUS_DELETE } = require('../constants')
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

  static async updateById({ id, user_id, data }) {
    return await Building.query()
      .where('user_id', user_id)
      .where('id', id)
      .update({ ...data })
  }

  static async updatePublishedMarketPlaceEstateIds(
    { id, user_id, published, marketplace_estate_ids },
    trx
  ) {
    await Building.query()
      .where('user_id', user_id)
      .where('id', id)
      .update({ marketplace_estate_ids, published })
      .transacting(trx)
  }

  static async delete({ id, user_id }) {
    return await Building.query()
      .where('id', id)
      .where('user_id', user_id)
      .update({ status: STATUS_DELETE })
  }

  static async get({ id, user_id }) {
    return await Building.query()
      .where('id', id)
      .where('user_id', user_id)
      .whereNot('status', STATUS_DELETE)
      .with('categories')
      .select(Database.raw(`DISTINCT(buildings.id)`))
      .select(
        Building.columns.filter((column) => column !== 'id').map((column) => `buildings.${column}`)
      )
      .first()
  }

  static async getByBuildingId({ user_id, building_id }) {
    return await Building.query()
      .where('building_id', building_id)
      .where('user_id', user_id)
      .whereNot('status', STATUS_DELETE)
      .first()
  }

  static async getAll(user_id) {
    return (
      await Building.query().where('user_id', user_id).whereNot('status', STATUS_DELETE).fetch()
    ).toJSON()
  }

  static async getAllHasUnit(user_id) {
    return (
      await Building.query()
        .select(Database.raw(`DISTINCT(buildings.id)`))
        .select('buildings.*')
        .innerJoin({ _e: 'estates' }, function () {
          this.on('_e.build_id', 'buildings.id')
        })
        .where('buildings.user_id', user_id)
        .whereNotNull('_e.build_id')
        .whereNot('_e.status', STATUS_DELETE)
        .fetch()
    ).toJSON()
  }

  static buildingIdQuery(params) {
    const param = 'building_id'
    let where = null
    if (params[param]) {
      if (params[param].operator && params[param].constraints.length > 0) {
        if (toLower(params[param].operator) === 'or') {
          params[param].constraints.map((constraint) => {
            if (!isNull(constraint.value)) {
              where = where ? ` OR ` : ''
              where += Filter.parseMatchMode(param, constraint.value, constraint.matchMode)
            }
          })
        } else if (toLower(params[param].operator) === 'and') {
          params[param].constraints.map((constraint) => {
            if (!isNull(constraint.value)) {
              where = where ? ` AND ` : ''
              where += Filter.parseMatchMode(param, constraint.value, constraint.matchMode)
            }
          })
        }
      }
    }

    let query
    if (where) {
      query = ` SELECT id from buildings where ${where}`
    }
    return query
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
      .with('categories')
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
      .orderBy('buildings.published', 'desc')

    const Filter = new EstateFilters(params, query)
    query = Filter.process()

    let buildings = []
    if (from !== -1 && limit != -1) {
      buildings = (await query.offset(from).limit(limit).fetch()).toJSON()
    } else {
      buildings = (await query.fetch()).toJSON()
    }

    if (!buildings?.length) {
      return []
    }
    const build_id = (buildings || []).map((building) => building.id)
    const estates = await require('./EstateService').getEstatesByUserId({
      user_ids: [user_id],
      params: { ...params, build_id, isStatusSort: true }
    })

    buildings = buildings.map((building) => ({
      ...building,
      estates: (estates?.data || []).filter((estate) => estate.build_id === building.id)
    }))
    return buildings
  }

  static async updateCanPublish({ user_id, build_id, estate = null }, trx) {
    const estates = await require('./EstateService').getEstatesByBuilding({ user_id, build_id })
    if (estate) {
      const index = estates.findIndex((e) => e.id === estate.id)
      if (index !== -1) {
        estates[index] = { ...estates[index], ...estate }
      }
    }
    const can_publish = (estates || []).every((estate) => estate.can_publish)

    await Building.query()
      .where('user_id', user_id)
      .where('id', build_id)
      .update({ can_publish, published: PUBLISH_STATUS_INIT })
      .transacting(trx)
  }
}

module.exports = BuildingService