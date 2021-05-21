const Database = use('Database')
const Tenant = use('App/Models/Tenant')
const EstateService = use('App/Services/EstateService')
const GeoService = use('App/Services/GeoService')
const AppException = use('App/Exceptions/AppException')

const { get, isNumber } = require('lodash')

const { MATCH_STATUS_NEW } = require('../constants')

const MATCH_PERCENT_PASS = 0

/**
 * Check is item in data range
 */
const inRange = (value, start, end) => {
  if (!isNumber(+value) || !isNumber(+start) || !isNumber(+end)) {
    return false
  }

  return +start <= +value && +value <= +end
}

class MatchService {
  /**
   * Get matches percent between estate/tenant
   */
  static calculateMatchPercent(tenant, estate) {
    // Props weight
    const areaWeight = 1
    const roomsNumberWeight = 1
    const aptTypeWeight = 1
    const floorWeight = 1
    const houseTypeWeight = 1
    const gardenWeight = 1
    const budgetWeight = 1
    const geoInsideWeight = 1
    const geoOutsideWeight = 0.5
    const ageWeight = 1
    const rentArrearsWeight = 1
    const familyStatusWeight = 1
    const petsWeight = 1
    const smokeWeight = 1
    const maxScore = 13

    let results = {
      geo: 0,
      area: 0,
      rooms: 0,
      apt_type: 0,
      floor: 0,
      house_type: 0,
      garden: 0,
      budget: 0,
      age: 0,
      smoke: 0,
      rent_arrears: 0,
      family: 0,
      pets: 0,
    }

    let score = 0
    // Geo position
    if (estate.inside) {
      results.geo = geoInsideWeight
      score += geoInsideWeight
    } else {
      results.geo = geoOutsideWeight
      score += geoOutsideWeight
    }

    // Is area in range
    if (inRange(estate.area, tenant.space_min, tenant.space_max)) {
      results.area = areaWeight
      score += areaWeight
    }

    // Rooms number in range
    if (inRange(estate.rooms_number, tenant.rooms_min, tenant.rooms_max)) {
      results.rooms = roomsNumberWeight
      score += roomsNumberWeight
    }

    // Apartment type is equal
    if (tenant.apt_type.includes(estate.apt_type)) {
      score += aptTypeWeight
      results.apt_type = aptTypeWeight
    }

    // Apt floor in range
    if (inRange(estate.floor, tenant.floor_min, tenant.floor_max)) {
      score += floorWeight
      results.floor = floorWeight
    }

    // House type is equal
    if (tenant.house_type.includes(estate.house_type)) {
      score += houseTypeWeight
      results.house_type = houseTypeWeight
    }

    // Garden exists
    // TODO: add condition
    if (false) {
      score += gardenWeight
      results.garden = gardenWeight
    }

    // Rent amount weight
    const rentAmount = tenant.include_utility
      ? estate.net_rent + (estate.additional_costs || 0)
      : estate.net_rent
    const budgetPass =
      (tenant.income / rentAmount) * 100 >= Math.min(estate.budget, tenant.budget_max)
    if (budgetPass) {
      score += budgetWeight
      results.budget = budgetWeight
    }

    // Get is members with age
    if (estate.min_age && estate.max_age && tenant.members_age) {
      const isInRange = (tenant.members_age || []).reduce((n, v) => {
        return n ? true : inRange(v, estate.min_age, estate.max_age)
      }, false)
      if (isInRange) {
        score += ageWeight
        results.age = ageWeight
      }
    }

    // Tenant has rent arrears
    if (!estate.rent_arrears || !tenant.unpaid_rental) {
      score += rentArrearsWeight
      results.rent_arrears = rentArrearsWeight
    }

    // Check family status
    if (!estate.family_status || +tenant.family_status === +estate.family_status) {
      score += familyStatusWeight
      results.family = familyStatusWeight
    }

    // Pets
    // TODO: add pets calc
    if (false) {
      score += petsWeight
      results.pets = petsWeight
    }

    // Smoke
    if (tenant.non_smoker || !estate.non_smoker) {
      score += smokeWeight
      results.smoke = smokeWeight
    }

    return (score / maxScore) * 100
  }

  /**
   *
   */
  static async matchByUser(userId) {
    const tenant = await Tenant.query()
      .select('tenants.*', '_p.data as polygon')
      .where({ 'tenants.user_id': userId })
      .innerJoin({ _p: 'points' }, '_p.id', 'tenants.point_id')
      .first()
    const polygon = get(tenant, 'polygon.data.0.0')
    if (!tenant || !polygon) {
      throw new AppException('Invalid tenant filters')
    }

    let maxLat = -90,
      maxLon = -180,
      minLat = 90,
      minLon = 180

    polygon.forEach(([lon, lat]) => {
      maxLat = Math.max(lat, maxLat)
      maxLon = Math.max(lon, maxLon)
      minLat = Math.min(lat, minLat)
      minLon = Math.min(lon, minLon)
    })

    // Max radius
    const dist = GeoService.getPointsDistance(maxLat, maxLon, minLat, minLon) / 2
    const estates = await EstateService.searchEstatesQuery(tenant, dist).limit(500)

    const matched = estates
      .reduce((n, v) => {
        const percent = MatchService.calculateMatchPercent(tenant, v)
        if (percent >= MATCH_PERCENT_PASS) {
          return [...n, { estate_id: v.id, percent }]
        }
        return n
      }, [])
      .map((i) => ({
        user_id: userId,
        estate_id: i.estate_id,
        percent: i.percent,
      }))

    // Delete old matches without any activity
    await Database.query()
      .from('matches')
      .where({ user_id: userId, status: MATCH_STATUS_NEW })
      .delete()

    // Create new matches
    const insertQuery = Database.query().into('matches').insert(matched).toString()
    await Database.raw(`${insertQuery} ON CONFLICT DO NOTHING`)

    console.log(matched)
  }

  /**
   *
   */
  matchByEstate(estateId) {
    /*
      SELECT
        _e.coord,
        _t.coord,
        CASE WHEN _p.zone IS NULL THEN FALSE ELSE _ST_Intersects(_e.coord::geometry, _p.zone::geometry) END AS cross
      FROM estates AS _e
      LEFT JOIN points AS _p
        ON _p.id = _e.point_id
      INNER JOIN tenants AS _t
        ON ST_DWithin(_e.coord::geography, _t.coord::geography, 20000)
      WHERE _e.id = 3
     */
  }
}

module.exports = MatchService
