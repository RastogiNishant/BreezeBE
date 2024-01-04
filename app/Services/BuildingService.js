'use strict'
const { toLower, isNull, get, isArray } = require('lodash')
const Building = use('App/Models/Building')
const Promise = require('bluebird')
const HttpException = require('../Exceptions/HttpException')
const EstateFilters = require('../Classes/EstateFilters')
const Filter = require('../Classes/Filter')
const Database = use('Database')
const {
  exceptions: { NO_BUILDING_ID_EXIST }
} = require('../exceptions')
const {
  PUBLISH_STATUS_INIT,
  STATUS_DELETE,
  MATCH_STATUS_KNOCK,
  MATCH_STATUS_INVITE,
  MATCH_STATUS_VISIT,
  MATCH_STATUS_SHARE,
  MATCH_TYPE_MARKET_PLACE,
  STATUS_EMAIL_VERIFY,
  STATUS_DRAFT
} = require('../constants')
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
    // exact count unique prospects
    // matches
    let matchesOnBuildingsQuery =
      (
        await Database.raw(`
        select count(*) as prospect_count, build_id from
        (
          select distinct on (matches.user_id) matches.user_id, buildings.id as build_id
          from matches
          inner join estates on estates.id=matches.estate_id
          inner join buildings on buildings.id=estates.build_id where matches.status=${MATCH_STATUS_KNOCK}
        ) as distinct_query
        group by build_id
      `)
      ).rows || []
    const inviteMatchesOnBuildings = matchesOnBuildingsQuery.reduce(
      (inviteMatchesOnBuildings, matchBuilding) => ({
        ...inviteMatchesOnBuildings,
        [matchBuilding.build_id]: matchBuilding.prospect_count
      }),
      {}
    )
    matchesOnBuildingsQuery =
      (
        await Database.raw(`
      select count(*) as prospect_count, build_id from
      (
        select distinct on (matches.user_id) matches.user_id, buildings.id as build_id
        from matches
        inner join estates on estates.id=matches.estate_id
        inner join buildings on buildings.id=estates.build_id where matches.status in (
          ${MATCH_STATUS_INVITE},
          ${MATCH_STATUS_VISIT},
          ${MATCH_STATUS_SHARE}
        )
      ) as distinct_query
      group by build_id
    `)
      ).rows || []
    const showMatchesOnBuildings = matchesOnBuildingsQuery.reduce(
      (inviteMatchesOnBuildings, matchBuilding) => ({
        ...inviteMatchesOnBuildings,
        [matchBuilding.build_id]: matchBuilding.prospect_count
      }),
      {}
    )
    matchesOnBuildingsQuery =
      (
        await Database.raw(`
      select count(*) as prospect_count, build_id from
      (
        select distinct on (matches.user_id) matches.user_id, buildings.id as build_id
        from matches
        inner join estates on estates.id=matches.estate_id
        inner join buildings on buildings.id=estates.build_id where matches.status >
          ${MATCH_STATUS_SHARE}
      ) as distinct_query
      group by build_id
    `)
      ).rows || []
    const decideMatchesOnBuildings = matchesOnBuildingsQuery.reduce(
      (inviteMatchesOnBuildings, matchBuilding) => ({
        ...inviteMatchesOnBuildings,
        [matchBuilding.build_id]: matchBuilding.prospect_count
      }),
      {}
    )
    // Contact requests...
    const contactRequestsOnBuildingsQuery =
      (
        await Database.raw(`
      select count(*) prospect_count, build_id from
      (
        select 
          distinct on (estate_sync_contact_requests.email) estate_sync_contact_requests.email,
          buildings.id as build_id
        from estate_sync_contact_requests
        inner join estates on estates.id=estate_sync_contact_requests.estate_id
        inner join buildings on buildings.id=estates.build_id
        where estate_sync_contact_requests.user_id is null
      ) as disctinct_query
      group by build_id
    `)
      ).rows || []

    const contactRequestsOnBuildings = contactRequestsOnBuildingsQuery.reduce(
      (contactRequestBuildings, cr) => ({
        ...contactRequestBuildings,
        [cr.build_id]: cr.prospect_count
      }),
      {}
    )
    buildings = buildings.map((building) => ({
      ...building,
      estates: (estates?.data || []).filter((estate) => estate.build_id === building.id),
      invite_count:
        (get(contactRequestsOnBuildings, building.id)
          ? Number(contactRequestsOnBuildings[building.id])
          : 0) +
        (get(inviteMatchesOnBuildings, building.id)
          ? Number(inviteMatchesOnBuildings[building.id])
          : 0),
      show_count: get(showMatchesOnBuildings, building.id)
        ? Number(showMatchesOnBuildings[building.id])
        : 0,
      decide_count: get(decideMatchesOnBuildings, building.id)
        ? Number(decideMatchesOnBuildings[building.id])
        : 0
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

  static async getContactRequestsByBuilding(buildingId) {
    const EstateSyncContactRequest = use('App/Models/EstateSyncContactRequest')
    const contactRequests = await EstateSyncContactRequest.query()
      .select(
        Database.raw(
          `array_agg(
            json_build_object(
              'id', estate_sync_contact_requests.id,
              'firstname', estate_sync_contact_requests.contact_info->'firstName',
              'secondname', estate_sync_contact_requests.contact_info->'lastName',
              'from_market_place', 1,
              'match_type', coalesce(estate_sync_contact_requests.publisher, '${MATCH_TYPE_MARKET_PLACE}'),
              'profession', estate_sync_contact_requests.contact_info->'employment',
              'members', estate_sync_contact_requests.contact_info->'family_size',
              'income', estate_sync_contact_requests.contact_info->'income',
              'birthday', estate_sync_contact_requests.contact_info->'birthday',
              'created_at', estate_sync_contact_requests.created_at,
              'updated_at', estate_sync_contact_requests.updated_at
          )) 
          as contact_requests`
        ),
        'estates.unit_category_id'
      )
      .innerJoin('estates', 'estates.id', 'estate_sync_contact_requests.estate_id')
      .whereNotNull('estates.unit_category_id')
      .where('estates.build_id', buildingId)
      .whereIn('estate_sync_contact_requests.status', [STATUS_EMAIL_VERIFY, STATUS_DRAFT])
      .groupBy('estates.unit_category_id')
      .fetch()
    return contactRequests.toJSON() || []
  }

  static async getContactRequestsCountByBuilding(buildingId) {
    const EstateSyncContactRequest = use('App/Models/EstateSyncContactRequest')
    const query = EstateSyncContactRequest.query()
      .select(
        Database.raw(`count(*) as contact_requests_count`),
        'estates.unit_category_id as unit_category_id'
      )
      .innerJoin('estates', 'estates.id', 'estate_sync_contact_requests.estate_id')
      .whereNotNull('estates.unit_category_id')
      .whereIn('estate_sync_contact_requests.status', [STATUS_EMAIL_VERIFY, STATUS_DRAFT])
      .groupBy('estates.unit_category_id')
    if (isArray(buildingId)) {
      query.whereIn('estates.build_id', buildingId)
    } else {
      query.where('estates.build_id', buildingId)
    }
    const contactRequests = await query.fetch()
    return contactRequests.toJSON() || []
  }
}

module.exports = BuildingService
