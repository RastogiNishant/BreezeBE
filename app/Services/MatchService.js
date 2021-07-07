const uuid = require('uuid')
const moment = require('moment')
const { get, isNumber, isEmpty, intersection } = require('lodash')
const { props } = require('bluebird')

const Logger = use('Logger')
const Database = use('Database')
const Estate = use('App/Models/Estate')
const User = use('App/Models/User')
const Tenant = use('App/Models/Tenant')
const EstateService = use('App/Services/EstateService')
const GeoService = use('App/Services/GeoService')
const AppException = use('App/Exceptions/AppException')

const {
  MATCH_STATUS_NEW,
  MATCH_STATUS_KNOCK,
  MATCH_STATUS_INVITE,
  MATCH_STATUS_VISIT,
  MATCH_STATUS_SHARE,
  MATCH_STATUS_TOP,
  MATCH_STATUS_COMMIT,
  MATCH_STATUS_FINISH,
  STATUS_ACTIVE,
  STATUS_EXPIRE,
  DATE_FORMAT,
  ROLE_USER,
  PETS_NO,
  PETS_SMALL,
  PETS_ANY,
} = require('../constants')

const MATCH_PERCENT_PASS = 40
const MAX_DIST = 10000
const MAX_SEARCH_ITEMS = 500

/**
 * Check is item in data range
 */
const inRange = (value, start, end) => {
  if (!isNumber(+value) || !isNumber(+start) || !isNumber(+end)) {
    return false
  }

  return +start <= +value && +value <= +end
}

const log = (data) => {
  return false
  // Logger.info('LOG', data)
}

class MatchService {
  /**
   * Get matches percent between estate/prospect
   */
  static calculateMatchPercent(prospect, estate) {
    // Props weight
    const amenitiesCount = 7
    const aptTypeWeight = 0.1
    const floorWeight = 0.2
    const houseTypeWeight = 0.1
    const ageWeight = 0.35
    const familyStatusWeight = 0.35
    const petsWeight = 0.1
    const smokeWeight = 0.1
    const amenitiesWeight = 0.5 / amenitiesCount

    const userIncome = prospect.income || 0
    const estatePrice = Estate.getFinalPrice(estate)
    let scoreL = 0
    let scoreT = 0
    const maxScoreT = 5.3
    const maxScoreL = 4.1
    const estateBudget = estate.budget || 0
    const prospectBudget = prospect.budget_max || 0

    const getCorr = (a, b, min = 0) => {
      if (Math.max(a, b) - min === 0) {
        return 1
      }
      return Math.min((Math.max(a, b) - Math.min(a, b)) / (Math.max(a, b) - min), 1)
    }

    // LANDLORD calculation part
    // Get landlord income score
    log({
      estatePrice,
      userIncome,
      estateBudget,
      prospectBudget,
    })
    const realBudget = estatePrice / userIncome
    log({ realBudget })
    if (realBudget <= estateBudget / 100) {
      const landlordBudgetPoints = 1 + getCorr(estateBudget, realBudget * 100, 0) * 0.1
      log({ landlordBudgetPoints })
      scoreL += landlordBudgetPoints
    }

    // Get credit score income
    const userCurrentCredit = prospect.credit_score || 0
    const userRequireCredit = estate.credit_score || 0
    log({ userCurrentCredit, userRequireCredit })
    if (userCurrentCredit >= userRequireCredit) {
      const creditScorePoints = 1 + getCorr(userCurrentCredit, userRequireCredit, 0) * 0.1
      log({ creditScorePoints })
      scoreL += creditScorePoints
    }

    // Get rent arrears score
    const rentArrearsWeight = 1
    log({ estateRentArrears: estate.rent_arrears, prospectUnpaidRental: prospect.unpaid_rental })
    if (!estate.rent_arrears || !prospect.unpaid_rental) {
      log({ rentArrearsPoints: rentArrearsWeight })
      scoreL += rentArrearsWeight
    }

    // Check family status
    log({ estateFamilyStatus: estate.family_status, prospectFamilyStatus: prospect.family_status })
    if (!estate.family_status || +prospect.family_status === +estate.family_status) {
      log({ familyStatusPoints: familyStatusWeight })
      scoreL += familyStatusWeight
    }

    // prospect smoke ask
    log({ prospectNonSmoker: prospect.non_smoker, estateNonSmoker: estate.non_smoker })
    if (prospect.non_smoker || !estate.non_smoker) {
      log({ smokePoints: smokeWeight })
      scoreL += smokeWeight
    }

    // Get is members with age
    log({
      estateMinAge: estate.min_age,
      estateMaxAge: estate.max_age,
      prospectMembersAge: prospect.members_age,
    })
    if (estate.min_age && estate.max_age && prospect.members_age) {
      const isInRange = (prospect.members_age || []).reduce((n, v) => {
        return n ? true : inRange(v, estate.min_age, estate.max_age)
      }, false)

      isInRange && log({ ageWeight })
      isInRange && (scoreL += ageWeight)
    }

    // Pets
    log({ prospectPets: prospect.pets, estatePets: estate.pets })
    if (prospect.pets === PETS_NO || estate.pets === PETS_ANY) {
      scoreL += petsWeight
      log({ petsWeight })
    } else if (prospect.pets === PETS_SMALL && estate.pets === PETS_SMALL) {
      scoreL += petsWeight
      log({ petsWeight })
    }

    const scoreLPer = scoreL / maxScoreL
    log({ scoreLandlordPercent: scoreLPer })
    // Check is need calculation next step
    if (scoreLPer < 0.5) {
      return 0
    }

    // -----------------------
    // prospect calculation part
    // -----------------------
    if (estatePrice / userIncome < prospectBudget) {
      const prospectBudgetPoints = 1 + getCorr(prospectBudget, realBudget * 100, 0) * 0.1
      log({ prospectBudgetPoints })
      scoreT += prospectBudgetPoints
    }

    log({
      estateArea: estate.area,
      prospectSpaceMin: prospect.space_min,
      prospectSpaceMax: prospect.space_max,
    })
    if (inRange(estate.area, prospect.space_min, prospect.space_max)) {
      const spacePoints = 1 + (1 - getCorr(prospect.space_max, estate.area, prospect.space_min)) * 0.1
      log({ spacePoints })
      scoreT += spacePoints
    }

    // Apt floor in range
    log({ floor: estate.floor, floorMin: prospect.floor_min, floorMax: prospect.floor_max })
    if (inRange(estate.floor, prospect.floor_min, prospect.floor_max)) {
      log({ floorWeight })
      scoreT += floorWeight
    }

    log({
      roomsNumber: estate.rooms_number,
      roomsMin: prospect.rooms_min,
      roomsMax: prospect.rooms_max,
    })
    if (inRange(estate.rooms_number, prospect.rooms_min, prospect.rooms_max)) {
      const roomsPoints =
        1 + (1 - getCorr(prospect.rooms_max, estate.rooms_number, prospect.rooms_min) || 1) * 0.1
      log({ roomsPoints })
      scoreT += roomsPoints
    }

    // Apartment type is equal
    log({ prospectAptType: prospect.apt_type, estateAptType: estate.apt_type })
    if ((prospect.apt_type || []).includes(estate.apt_type)) {
      log({ aptTypeWeight })
      scoreT += aptTypeWeight
    }

    // House type is equal
    log({ prospectHouseType: prospect.house_type, estateHouseType: estate.house_type })
    if ((prospect.house_type || []).includes(estate.house_type)) {
      log({ houseTypeWeight })
      scoreT += houseTypeWeight
    }

    log({ estateAmenities: estate.options, prospectAmenities: prospect.options })
    const passAmenities = intersection(estate.options, prospect.options).length
    const amenitiesScore = passAmenities * amenitiesWeight
    log({ amenitiesScore })
    scoreT += amenitiesScore

    const rentStart = parseInt(moment(prospect.rent_start).startOf('day').format('X'))
    const vacantFrom = parseInt(moment(estate.vacant_date).startOf('day').format('X'))
    log({ rentStart, vacantFrom })
    if (rentStart <= vacantFrom) {
      const daysDiff = (vacantFrom - rentStart) / 86400
      const MAX_DAYS = 730
      const rentStartPoints = 1 + (1 - Math.min(daysDiff, MAX_DAYS) / MAX_DAYS) * 0.1
      scoreT += rentStartPoints
      log({ rentStartPoints })
    }

    const scoreTPer = scoreT / maxScoreT
    log({ scoreProspectPercent: scoreTPer })
    // Check is need calculation next step
    if (scoreTPer < 0.5) {
      return 0
    }

    return ((scoreTPer + scoreLPer) / 2) * 100
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
    const estates = await EstateService.searchEstatesQuery(tenant, dist).limit(MAX_SEARCH_ITEMS)

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
      .whereNot({ buddy: true })
      .delete()

    // Create new matches
    if (!isEmpty(matched)) {
      const insertQuery = Database.query().into('matches').insert(matched).toString()
      await Database.raw(`${insertQuery} ON CONFLICT DO NOTHING`)
    }
  }

  /**
   *
   */
  static async matchByEstate(estateId) {
    // Get current estate
    const estate = await Estate.query().where({ id: estateId }).first()
    // Get tenant in zone and check crossing with every tenant search zone
    const tenants = await Database.from({ _e: 'estates' })
      .select(
        '_t.*',
        Database.raw(
          `CASE WHEN _p.zone IS NULL THEN FALSE ELSE _ST_Intersects(_e.coord::geometry, _p.zone::geometry) END AS inside`
        )
      )
      .leftJoin({ _p: 'points' }, '_p.id', '_e.point_id')
      .innerJoin({ _t: 'tenants' }, function () {
        this.on(Database.raw(`ST_DWithin(_e.coord::geography, _t.coord::geography, ?)`, [MAX_DIST]))
      })
      .where('_e.id', estateId)
      .limit(MAX_SEARCH_ITEMS)

    // Calculate matches for tenants to current estate
    const matched = tenants
      .reduce((n, v) => {
        const percent = MatchService.calculateMatchPercent(v, estate)
        if (percent >= MATCH_PERCENT_PASS) {
          return [...n, { user_id: v.user_id, percent }]
        }
        return n
      }, [])
      .map((i) => ({
        user_id: i.user_id,
        estate_id: estate.id,
        percent: i.percent,
      }))

    // Delete old matches without any activity
    await Database.query()
      .from('matches')
      .where({ estate_id: estate.id, status: MATCH_STATUS_NEW })
      .delete()

    // Create new matches
    if (!isEmpty(matched)) {
      const insertQuery = Database.query().into('matches').insert(matched).toString()
      await Database.raw(`${insertQuery} ON CONFLICT DO NOTHING`)
    }
  }

  /**
   * Try to knock to estate
   */
  static async knockEstate(estateId, userId) {
    const tenant = await Tenant.query().where({ user_id: userId, status: STATUS_ACTIVE }).first()
    if (!tenant) {
      throw new AppException('Invalid user status')
    }

    // Get match with allowed status
    const getMatches = async () => {
      return Database.query()
        .from('matches')
        .where({ user_id: userId, estate_id: estateId })
        .first()
    }

    // Get like and check is match not exists or new
    const getLikes = () => {
      return Database.query()
        .from('likes')
        .select('matches.status')
        .where({ 'likes.user_id': userId, 'likes.estate_id': estateId })
        .leftJoin('matches', function () {
          this.on('matches.estate_id', 'likes.estate_id').on('matches.user_id', 'likes.user_id')
        })
        .first()
    }

    const { like, match } = await props({
      match: getMatches(),
      like: getLikes(),
    })

    if (match) {
      if (match.status === MATCH_STATUS_NEW) {
        // Update match to knock
        // TODO: send landlord knock notification
        await Database.table('matches').update({ status: MATCH_STATUS_KNOCK }).where({
          user_id: userId,
          estate_id: estateId,
        })

        return true
      }

      throw new AppException('Invalid match stage')
    }

    if (like) {
      // TODO: send landlord knock notification
      await Database.into('matches').insert({
        status: MATCH_STATUS_KNOCK,
        user_id: userId,
        estate_id: estateId,
        percent: 0,
      })

      return true
    }

    throw new AppException('Not allowed')
  }

  /**
   * Invite knocked user
   */
  static async inviteKnockedUser(estateId, userId) {
    const match = await Database.query()
      .table('matches')
      .where({ user_id: userId, status: MATCH_STATUS_KNOCK })
      .first()

    if (!match) {
      throw new AppException('Invalid match stage')
    }

    await Database.table('matches').update({ status: MATCH_STATUS_INVITE }).where({
      user_id: userId,
      estate_id: estateId,
    })
    // TODO: notification to tenant, got invite
  }

  /**
   * Cancel invite if already invited
   */
  static async cancelInvite(estateId, userId) {
    const match = await Database.query()
      .table('matches')
      .where({ user_id: userId, status: MATCH_STATUS_INVITE })
      .first()

    if (!match) {
      throw new AppException('Invalid match stage')
    }

    await Database.table('matches').update({ status: MATCH_STATUS_KNOCK }).where({
      user_id: userId,
      estate_id: estateId,
    })
  }

  /**
   * Chose available visit timeslot and move to next status
   */
  static async bookTimeslot(estateId, userId, date) {
    const getMatch = async () => {
      return Database.table('matches')
        .where({ user_id: userId, status: MATCH_STATUS_INVITE })
        .first()
    }

    const getUserBookAnother = () =>
      Database.table('visits').where({ user_id: userId, estate_id: estateId }).first()

    const { estate, match, existingUserBook } = await props({
      estate: Estate.query().where({ id: estateId, status: STATUS_ACTIVE }).first(),
      match: getMatch(),
      existingUserBook: getUserBookAnother(),
    })

    if (!estate) {
      throw new AppException('Estate is on invalid status')
    }
    if (!match) {
      throw new AppException('Match stage is invalid')
    }
    if (existingUserBook) {
      throw new AppException('User already booked another timeslot')
    }

    const slotDate = moment.utc(date, DATE_FORMAT)
    const getTimeslot = async () =>
      Database.table('time_slots')
        .where({ estate_id: estateId })
        .where('start_at', '<=', slotDate.format(DATE_FORMAT))
        .where('end_at', '>', slotDate.format(DATE_FORMAT))
        .first()

    const getAnotherVisit = async () =>
      Database.table('visits')
        .where({ estate_id: estateId })
        .where({ date: slotDate.format(DATE_FORMAT) })
        .first()

    const { currentTimeslot, anotherVisit } = await props({
      currentTimeslot: getTimeslot(),
      anotherVisit: getAnotherVisit(),
    })

    if (!currentTimeslot || anotherVisit) {
      throw new AppException('Cant book this slot')
    }

    // Book new visit to calendar
    await Database.into('visits').insert({
      estate_id: estate.id,
      user_id: userId,
      date: slotDate.format(DATE_FORMAT),
    })
    // Move match status to next
    await Database.table('matches').update({ status: MATCH_STATUS_VISIT }).where({
      user_id: userId,
      estate_id: estateId,
    })
  }

  /**
   * Share tenant personal data to landlord
   */
  static async share(landlordId, estateId, tenantCode) {
    const userTenant = await User.findByOrFail({ uid: tenantCode, role: ROLE_USER })
    const match = await Database.table('matches')
      .where({
        estate_id: estateId,
        status: MATCH_STATUS_VISIT,
        user_id: userTenant.id,
      })
      .first()
    if (!match) {
      throw new AppException('Invalid code or match status')
    }

    await Database.table('matches')
      .update({
        status: MATCH_STATUS_SHARE,
        share: true,
      })
      .where({
        user_id: userTenant.id,
        estate_id: estateId,
      })
  }

  /**
   *
   */
  static async toTop(estateId, tenantId) {
    return Database.table('matches')
      .update({ status: MATCH_STATUS_TOP })
      .where({
        user_id: tenantId,
        estate_id: estateId,
      })
      .whereIn('status', [MATCH_STATUS_SHARE, MATCH_STATUS_VISIT])
  }

  /**
   *
   */
  static async removeFromTop(estateId, tenantId) {
    const match = await Database.table('matches')
      .where({
        status: MATCH_STATUS_TOP,
        user_id: tenantId,
        estate_id: estateId,
      })
      .first()

    if (!match) {
      throw new AppException('Invalid match status')
    }

    await Database.table('matches')
      .update({ status: match.share ? MATCH_STATUS_SHARE : MATCH_STATUS_VISIT })
      .where({
        user_id: tenantId,
        estate_id: estateId,
      })
  }

  /**
   *
   */
  static async requestFinalConfirm(estateId, tenantId) {
    await Database.table('matches').update({ status: MATCH_STATUS_COMMIT }).where({
      user_id: tenantId,
      estate_id: estateId,
      status: MATCH_STATUS_TOP,
    })
    // TODO: notification final commit request
  }

  /**
   * Tenant confirmed final request
   */
  static async finalConfirm(estateId, tenantId) {
    await Database.table('matches').update({ status: MATCH_STATUS_FINISH }).where({
      user_id: tenantId,
      estate_id: estateId,
      status: MATCH_STATUS_COMMIT,
    })
    // TODO: remove rest matches, estates rent confirmed
  }

  /**
   * If buddy accept invite
   */
  static async addBuddy(estateId, tenantId) {
    const match = await Database.table('matches')
      .where({
        user_id: tenantId,
        estate_id: estateId,
      })
      .first()

    if (!match) {
      return Database.table('matches').insert({
        user_id: tenantId,
        estate_id: estateId,
        percent: 0,
        buddy: true,
        status: MATCH_STATUS_KNOCK,
      })
    }

    if (match.buddy) {
      throw new AppException('Already applied')
    }

    // Match exists but without buddy
    return Database.table('matches')
      .update({
        buddy: true,
        status: match.status === MATCH_STATUS_NEW ? MATCH_STATUS_KNOCK : match.status,
      })
      .where({
        user_id: tenantId,
        estate_id: estateId,
      })
  }

  /**
   *
   */
  static getTenantMatchesWithFilterQuery(
    userId,
    { buddy, like, dislike, knock, invite, share, top, commit }
  ) {
    const query = Estate.query()
      .select('estates.*')
      .select('_m.percent as match')
      .select('_m.updated_at')
      .orderBy('_m.updated_at', 'DESC')
      .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])

    if (!like && !dislike) {
      query.innerJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id').onIn('_m.user_id', userId)
      })
    }

    if (buddy) {
      // Buddy show knocked matches with buddy only for active estate
      query
        .clearWhere()
        .where({ 'estates.status': STATUS_ACTIVE })
        .where({ '_m.status': MATCH_STATUS_KNOCK, '_m.buddy': true })
    } else if (like) {
      // All liked estates
      query
        .clearSelect()
        .select('estates.*')
        .select('_m.updated_at')
        .select(Database.raw('COALESCE(_m.percent, 0) as match'))
        .innerJoin({ _l: 'likes' }, function () {
          this.on('_l.estate_id', 'estates.id').onIn('_l.user_id', userId)
        })
        .leftJoin({ _m: 'matches' }, function () {
          this.on('_m.estate_id', 'estates.id').onIn('_m.user_id', userId)
        })
        .where(function () {
          this.orWhere('_m.status', MATCH_STATUS_NEW).orWhereNull('_m.status')
        })
    } else if (dislike) {
      // All disliked estates
      query
        .clearSelect()
        .select('estates.*')
        .select('_m.updated_at')
        .select(Database.raw('COALESCE(_m.percent, 0) as match'))
        .innerJoin({ _d: 'dislikes' }, function () {
          this.on('_d.estate_id', 'estates.id').onIn('_d.user_id', userId)
        })
        .leftJoin({ _m: 'matches' }, function () {
          this.on('_m.estate_id', 'estates.id').onIn('_m.user_id', userId)
        })
        .where(function () {
          this.orWhere('_m.status', MATCH_STATUS_NEW).orWhereNull('_m.status')
        })
    } else if (knock) {
      query.where({ '_m.status': MATCH_STATUS_KNOCK }).whereNot('_m.buddy', true)
    } else if (invite) {
      query
        .whereIn('_m.status', [MATCH_STATUS_INVITE, MATCH_STATUS_VISIT])
        .where({ '_m.share': false })
        .whereNot('_m.share', true)
    } else if (share) {
      query
        .whereIn('_m.status', [MATCH_STATUS_INVITE, MATCH_STATUS_VISIT, MATCH_STATUS_SHARE])
        .where({ '_m.share': true })
        .clearOrder()
        .orderBy([
          { column: '_m.order_tenant', order: 'ASK' },
          { column: '_m.updated_at', order: 'DESC' },
        ])
    } else if (top) {
      query
        .where({ '_m.status': MATCH_STATUS_TOP })
        .clearOrder()
        .orderBy([
          { column: '_m.order_tenant', order: 'ASK' },
          { column: '_m.updated_at', order: 'DESC' },
        ])
    } else if (commit) {
      query
        .innerJoin({ _u: 'users' }, '_u.id', 'estates.user_id')
        .select('_u.email', '_u.phone', '_u.avatar')
        .whereIn('_m.status', [MATCH_STATUS_COMMIT, MATCH_STATUS_FINISH])
    } else {
      throw new AppException('Invalid filter params')
    }

    return query
  }

  /**
   * Get tenants matched to current estate
   */
  static getLandlordMatchesWithFilterQuery(estate, { knock, buddy, invite, visit, top, commit }) {
    const query = Tenant.query()
      .select('tenants.*')
      .select('_m.updated_at', '_m.percent as percent', '_m.share')
      .select('_u.firstname', '_u.secondname', '_u.birthday', '_u.avatar')
      .innerJoin({ _u: 'users' }, 'tenants.user_id', '_u.id')
      .where({ '_u.role': ROLE_USER })
      .innerJoin({ _m: 'matches' }, function () {
        this.on('_m.user_id', '_u.id').onIn('_m.estate_id', [estate.id])
      })
      .orderBy('_m.updated_at', 'DESC')

    if (knock) {
      query.where({ '_m.status': MATCH_STATUS_KNOCK }).whereNot('_m.buddy', true)
    } else if (buddy) {
      query.where({ '_m.status': MATCH_STATUS_KNOCK, '_m.buddy': true })
    } else if (invite) {
      query.whereIn('_m.status', [MATCH_STATUS_INVITE])
    } else if (visit) {
      query.whereIn('_m.status', [MATCH_STATUS_VISIT, MATCH_STATUS_SHARE])
    } else if (top) {
      query
        .where('_m.status', MATCH_STATUS_TOP)
        .clearOrder()
        .orderBy([
          { column: '_m.order_lord', order: 'ASK' },
          { column: '_m.updated_at', order: 'DESC' },
        ])
    } else if (commit) {
      query.whereIn('_m.status', [MATCH_STATUS_COMMIT, MATCH_STATUS_FINISH])
    }

    return query
  }

  /**
   *
   */
  static async reorderMatches(user, estateId, userId, position) {
    const sequence = 'seq_' + uuid.v4('tmp_seq_1').replace(/-/g, '')
    const dropSequence = async (seq) => Database.raw(`DROP SEQUENCE IF EXISTS ${seq}`)
    const createSequence = async (seq) => Database.raw(`CREATE SEQUENCE ${seq}`)
    const isTenant = user.role === ROLE_USER

    // Create new sequence
    await createSequence(sequence)
    // Disable TRIGGER
    await Database.raw(`SET session_replication_role = replica`)
    // Change conditions to tenant
    let field = isTenant ? 'order_tenant' : 'order_lord'

    // Create new items order
    const subQuery = Database.table({ _m: 'matches' })
      .select(
        '_m.user_id',
        '_m.estate_id',
        Database.raw(`nextval('${sequence}')::INT AS item_order`)
      )
      .orderBy([
        { column: `_m.${field}`, order: 'ASC' },
        { column: '_m.updated_at', order: 'DESC' },
      ])
    // Add custom conditions
    if (isTenant) {
      subQuery.where('_m.user_id', user.id).whereIn('_m.status', function () {
        this.select('status')
          .from('matches')
          .where({ user_id: user.id, estate_id: estateId })
          .limit(1)
      })
    } else {
      subQuery.where('_m.estate_id', estateId).whereIn('_m.status', function () {
        this.select('status')
          .from('matches')
          .where({ user_id: userId, estate_id: estateId })
          .limit(1)
      })
    }

    // Refresh current items order
    // noinspection SqlResolve
    const updateQuery = `
      UPDATE matches as _m
        SET ${field} = _t2.item_order
        FROM
        (${subQuery.toString()})  AS _t2
        WHERE
          _t2.estate_id = _m.estate_id
          AND _t2.user_id = _m.user_id`

    const getCurrentOrderItems = () =>
      Database.table('matches')
        .select(`${field} AS current_position`)
        .select(`status`)
        .where({ estate_id: estateId, user_id: isTenant ? user.id : userId })
        .first()

    // Move items positions in range
    const updatePositions = async (start, end, offset, status) => {
      const startOf = Math.min(+start, +end)
      const endOf = Math.max(+start, +end)
      return Database.raw(
        `UPDATE matches SET ${field} = ${field} - ? 
          WHERE ${isTenant ? 'user_id' : 'estate_id'} = ? 
            AND ( ${field} BETWEEN ? AND ? )
            AND status = ?
            `,
        [offset, isTenant ? user.id : estateId, startOf, endOf, status]
      )
    }

    // Update current tenant position
    const updateTarget = () => {
      return Database.raw(`UPDATE matches SET ${field} = ? WHERE estate_id = ? AND user_id = ?`, [
        position,
        estateId,
        isTenant ? user.id : userId,
      ])
    }

    try {
      await Database.raw(updateQuery)
      const item = await getCurrentOrderItems()
      if (!item) {
        throw new AppException('Invalid item')
      }

      let offset = 0
      if (item.current_position < position) {
        // Move down
        offset = 1
      } else if (item.current_position > position) {
        // Move up
        offset = -1
      }

      await updatePositions(item.current_position, position, offset, item.status)
      await updateTarget()
    } finally {
      await dropSequence(sequence)
      await Database.raw(`SET session_replication_role = DEFAULT`)
    }
  }
}

module.exports = MatchService
