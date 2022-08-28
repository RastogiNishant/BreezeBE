const uuid = require('uuid')
const moment = require('moment')
const { get, isNumber, isEmpty, intersection } = require('lodash')
const { props } = require('bluebird')

const Database = use('Database')
const Estate = use('App/Models/Estate')
const Match = use('App/Models/Match')
const User = use('App/Models/User')
const Visit = use('App/Models/Visit')
const Logger = use('Logger')
const Tenant = use('App/Models/Tenant')
const UserService = use('App/Services/UserService')
const EstateService = use('App/Services/EstateService')
const MailService = use('App/Services/MailService')
const NoticeService = use('App/Services/NoticeService')
const GeoService = use('App/Services/GeoService')
const AppException = use('App/Exceptions/AppException')
const Buddy = use('App/Models/Buddy')
const { max, min } = require('lodash')
const Event = use('Event')
const File = use('App/Classes/File')

const EstateCurrentTenantService = use('App/Services/EstateCurrentTenantService')
const TenantService = use('App/Services/TenantService')

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
  TENANT_TABS_BUDDY,
  TENANT_TABS_LIKE,
  TENANT_TABS_KNOCK,
  TENANT_TABS_INVITE,
  TENANT_TABS_SHARE,
  TENANT_TABS_TOP,
  TENANT_TABS_COMMIT,
  LANDLORD_TABS_KNOCK,
  LANDLORD_TABS_BUDDY,
  LANDLORD_TABS_INVITE,
  LANDLORD_TABS_VISIT,
  LANDLORD_TABS_TOP,
  LANDLORD_TABS_COMMIT,
  TIMESLOT_STATUS_COME,
  NO_UNPAID_RENTAL,
  STATUS_DRAFT,
  BUDDY_STATUS_ACCEPTED,
  MINIMUM_SHOW_PERIOD,
  MEMBER_FILE_TYPE_PASSPORT,
  TIMESLOT_STATUS_CONFIRM,
  MAX_SEARCH_ITEMS,
  DEFAULT_LANG,
} = require('../constants')
const { logger } = require('../../config/app')
const HttpException = require('../Exceptions/HttpException')

const MATCH_PERCENT_PASS = 40

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
  //Logger.info('LOG', data)
  //console.log(data)
}

class MatchService {
  /**
   * Get matches percent between estate/prospect
   */
  static calculateMatchPercent(prospect, estate) {
    // Property Score weight
    // landlordBudgetWeight = 1
    // creditScoreWeight = 1
    // rentArrearsWeight = 1
    const ageWeight = 0.6
    const householdSizeWeight = 0.3
    const petsWeight = 0.1
    const maxScoreL = 4

    const amenitiesCount = 7
    // Prospect Score Weights
    const prospectBudgetWeight = 2
    const rentStartWeight = 0.5
    const amenitiesWeight = 0.4 / amenitiesCount
    const areaWeight = 0.4
    const floorWeight = 0.3
    const roomsWeight = 0.2
    const aptTypeWeight = 0.1
    const houseTypeWeight = 0.1
    const maxScoreT = 4

    const userIncome = parseFloat(prospect.income) || 0
    const estatePrice = Estate.getFinalPrice(estate)
    let prospectHouseholdSize = parseInt(prospect.members_count) || 1 //adult count
    let estateFamilySizeMax = parseInt(estate.family_size_max) || 1
    let estateFamilySizeMin = parseInt(estate.family_size_min) || 1
    let scoreL = 0
    let scoreT = 0

    const estateBudget = estate.budget || 0
    const prospectBudget = prospect.budget_max || 0

    // LANDLORD calculation part
    // Get landlord income score
    log({
      estatePrice,
      userIncome,
      estateBudget,
      prospectBudget,
    })

    if (!userIncome) {
      //added to prevent division by zero on calculation for realBudget
      return 0
    }
    const realBudget = estatePrice / userIncome

    let landlordBudgetPoints = 0
    let creditScorePoints = 0
    let rentArrearsScore = 0
    let familyStatusScore = 0
    let ageInRangeScore = 0
    let householdSizeScore = 0
    let petsScore = 0
    let roomsPoints = 0
    let floorScore = 0
    let prospectBudgetPoints = 0
    let aptTypeScore = 0
    let houseTypeScore = 0
    let spacePoints = 0
    let amenitiesScore = 0
    let rentStartPoints = 0

    /*
    IF(E2>1,0,IF(D2>=E2,1,(E2-1)/(D2-1)))
    E2 - realBudget
    D2 - estateBudgetRel*/
    if (realBudget > 1) {
      //This means estatePrice is bigger than prospect's income. Prospect can't afford it
      log("Prospect can't afford.")
      return 0
    }
    let estateBudgetRel = estateBudget / 100
    log({ estateBudgetRel, realBudget })
    if (estateBudgetRel >= realBudget) {
      //landlordBudgetPoints = realBudget / estateBudgetRel
      landlordBudgetPoints = 1
    } else {
      landlordBudgetPoints = (realBudget - 1) / (estateBudgetRel - 1)
    }
    scoreL += landlordBudgetPoints

    // Get credit score income
    const userCurrentCredit = prospect.credit_score || 0
    const userRequiredCredit = estate.credit_score || 0

    log({ userCurrentCredit, userRequiredCredit })

    if (userCurrentCredit == 100 && userRequiredCredit == 100) {
      creditScorePoints = 1
    } else if (userCurrentCredit > userRequiredCredit) {
      creditScorePoints =
        0.9 + ((userCurrentCredit - userRequiredCredit) * (1 - 0.9)) / (100 - userRequiredCredit)
    } else {
      creditScorePoints = (1 - (userRequiredCredit - userCurrentCredit) / userRequiredCredit) * 0.9
    }
    scoreL += creditScorePoints
    log({ userCurrentCredit, userRequiredCredit, creditScorePoints })

    // Get rent arrears score
    const rentArrearsWeight = 1
    if (!estate.rent_arrears || prospect.rent_arrears === NO_UNPAID_RENTAL) {
      log({ rentArrearsPoints: rentArrearsWeight })
      scoreL += rentArrearsWeight
      rentArrearsScore = 1
    }
    log({ estateRentArrears: estate.rent_arrears, prospectUnpaidRental: prospect.rent_arrears })

    // prospect's age
    log({
      estateMinAge: estate.min_age,
      estateMaxAge: estate.max_age,
      prospectMembersAge: prospect.members_age,
    })
    if (estate.min_age && estate.max_age && prospect.members_age) {
      const isInRangeArray = (prospect.members_age || []).map((age) => {
        return inRange(age, estate.min_age, estate.max_age)
      })
      if (isInRangeArray.every((val, i, arr) => val === arr[0]) && isInRangeArray[0] === true) {
        //all ages are within the age range of the estate
        scoreL += ageWeight
        ageInRangeScore = ageWeight
      } else {
        //some ages are outside range...
        if (max(prospect.members_age) > estate.max_age) {
          ageInRangeScore =
            ageWeight * (1 - (max(prospect.members_age) - estate.max_age) / estate.max_age)
        } else if (min(prospect.members_age) < estate.min_age) {
          ageInRangeScore =
            ageWeight * (1 - (estate.min_age - min(prospect.members_age)) / estate.min_age)
        }
        scoreL += ageInRangeScore
      }
    }

    //Household size
    log({ prospectHouseholdSize, estateFamilySizeMin, estateFamilySizeMax })
    if (
      prospectHouseholdSize >= estateFamilySizeMin &&
      prospectHouseholdSize <= estateFamilySizeMax
    ) {
      // Prospect Household Size is within the range of the estate's family size
      householdSizeScore = householdSizeWeight
      scoreL += householdSizeWeight
    } else {
      if (prospectHouseholdSize > estateFamilySizeMax) {
        householdSizeScore =
          householdSizeWeight *
          (1 - (prospectHouseholdSize - estateFamilySizeMax) / estateFamilySizeMax)
      } else if (prospectHouseholdSize < estateFamilySizeMin) {
        householdSizeScore =
          householdSizeWeight *
          (1 - (estateFamilySizeMin - prospectHouseholdSize) / estateFamilySizeMin)
      }
      scoreL += householdSizeScore
    }
    // Pets
    log({ prospectPets: prospect.pets, estatePets: estate.pets })
    if (prospect.pets === PETS_NO || estate.pets === PETS_ANY) {
      scoreL += petsWeight
      log({ petsWeight })
      petsScore = petsWeight
    } else if (prospect.pets === PETS_SMALL && estate.pets === PETS_SMALL) {
      scoreL += petsWeight
      log({ petsWeight })
      petsScore = petsWeight
    }

    const scoreLPer = scoreL / maxScoreL
    log({ scoreLandlordPercent: scoreLPer })

    // Check if we need to proceed
    if (scoreLPer < 0.5) {
      log('landlord score fails.')
      return 0
    }

    // -----------------------
    // prospect calculation part
    // -----------------------
    const prospectBudgetRel = prospectBudget / 100
    /* IF(E2>1,0,IF(D2>=E2,1,(E2-1)/(D2-1)))
    E2 - realBudget
    D2 - prospectBudgetRel
    */
    if (realBudget > 1) {
      prospectBudgetPoints = 0
    } else if (prospectBudgetRel >= realBudget) {
      prospectBudgetPoints = 1
      //prospectBudgetPoints = realBudget / prospectBudgetRel - old fmla
    } else {
      prospectBudgetPoints = (realBudget - 1) / (prospectBudgetRel - 1)
    }
    prospectBudgetPoints = prospectBudgetWeight * prospectBudgetPoints
    log({ userIncome, prospectBudgetPoints, realBudget, prospectBudget: prospectBudget / 100 })
    scoreT = prospectBudgetPoints

    const estateArea = Number(estate.area) || 0
    if (estateArea >= prospect.space_min && estateArea <= prospect.space_max) {
      spacePoints = areaWeight
      scoreT += spacePoints
    } else {
      if (estateArea > prospect.space_max) {
        spacePoints = areaWeight * (0.9 + (estateArea - prospect.space_max) / estateArea) * 0.1
      } else if (estateArea < prospect.space_min) {
        spacePoints =
          areaWeight * (0.9 + (prospect.space_min - estateArea) / prospect.space_min) * 0.1
      }
      scoreT += spacePoints
    }
    log({
      estateArea,
      prospectMin: prospect.space_min,
      prospectMax: prospect.space_max,
      spacePoints,
    })

    // Apt floor in range
    const estateFloors = parseInt(estate.number_floors) || 0
    if (estateFloors >= prospect.floor_min && estateFloors <= prospect.floor_max) {
      scoreT += floorWeight
      floorScore = floorWeight
    } else {
      if (estateFloors > prospect.floor_max) {
        floorScore = floorWeight * (0.9 + (estateFloors - prospect.floor_max) / estateFloors) * 0.1
      } else if (estateFloors < prospect.floor_min) {
        floorScore =
          floorWeight * (0.9 + (prospect.floor_min - estateFloors) / prospect.floor_min) * 0.1
      }
      scoreT += floorScore
    }
    log({
      floor: estate.number_floors,
      floorMin: prospect.floor_min,
      floorMax: prospect.floor_max,
      floorScore,
    })

    // Rooms
    if (estate.rooms_number >= prospect.rooms_min && estate.rooms_number <= prospect.rooms_max) {
      roomsPoints = roomsWeight
      scoreT += roomsPoints
    } else {
      if (estate.rooms_number > prospect.rooms_max) {
        roomsPoints =
          roomsWeight *
          (0.9 + (estate.rooms_number - prospect.rooms_max) / estate.rooms_number) *
          0.1
      } else if (estate.rooms_number < prospect.rooms_min) {
        roomsPoints =
          roomsWeight *
          (0.9 + (prospect.rooms_min - estate.rooms_number) / prospect.rooms_min) *
          0.1
      }
      scoreT += roomsPoints
    }
    log({
      roomsNumber: estate.rooms_number,
      roomsMin: prospect.rooms_min,
      roomsMax: prospect.rooms_max,
      roomsPoints,
    })

    // Apartment type is equal
    log({ prospectAptType: prospect.apt_type, estateAptType: estate.apt_type })
    if ((prospect.apt_type || []).includes(estate.apt_type)) {
      log({ aptTypeWeight })
      scoreT += aptTypeWeight
      aptTypeScore = aptTypeWeight
    }

    // House type is equal
    log({ prospectHouseType: prospect.house_type, estateHouseType: estate.house_type })
    if ((prospect.house_type || []).includes(estate.house_type)) {
      log({ houseTypeWeight })
      scoreT += houseTypeWeight
      houseTypeScore = houseTypeWeight
    }

    log({ estateAmenities: estate.options, prospectAmenities: prospect.options })
    const passAmenities = intersection(estate.options, prospect.options).length
    amenitiesScore = passAmenities * amenitiesWeight
    log({ amenitiesScore })
    scoreT += amenitiesScore

    const rentStart = parseInt(moment(prospect.rent_start).startOf('day').format('X'))
    const vacantFrom = parseInt(moment(estate.vacant_date).startOf('day').format('X'))
    const now = parseInt(moment().startOf('day').format('X'))
    const nextYear = parseInt(moment().add(1, 'y').format('X'))

    //vacantFrom (min) rentStart (i)
    // we check outlyers first now and nextYear
    // note this is fixed in feature/add-unit-test-to-match-scoring
    if (rentStart < now || rentStart > nextYear || vacantFrom < now || vacantFrom > nextYear) {
      rentStartPoints = 0
    } else if (rentStart >= vacantFrom) {
      rentStartPoints = 0.9 + (0.1 * (rentStart - vacantFrom)) / rentStart
    } else if (rentStart < vacantFrom) {
      rentStartPoints = 0.9 * (1 - (vacantFrom - rentStart) / vacantFrom)
    }
    log({ rentStart, vacantFrom, now, nextYear, rentStartPoints })
    rentStartPoints = rentStartPoints * rentStartWeight
    scoreT += rentStartPoints

    const scoreTPer = scoreT / maxScoreT
    log({ scoreProspectPercent: scoreTPer })

    // Check is need calculation next step
    if (scoreTPer < 0.5) {
      log('prospect score fails')
      return 0
    }
    log('\n\n')
    return ((scoreTPer + scoreLPer) / 2) * 100
  }

  /**
   *
   */
  static async matchByUser(userId, ignoreNullFields = false) {
    const tenant = await MatchService.getProspectForScoringQuery()
      .select('_p.data as polygon')
      .innerJoin({ _p: 'points' }, '_p.id', 'tenants.point_id')
      .where({ 'tenants.user_id': userId })
      .first()
    const polygon = get(tenant, 'polygon.data.0.0')
    if (!tenant || !polygon) {
      if (ignoreNullFields) {
        return
      } else {
        throw new AppException('Invalid tenant filters')
      }
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
    let estates = await EstateService.searchEstatesQuery(tenant, dist).limit(MAX_SEARCH_ITEMS)
    const estateIds = estates.reduce((estateIds, estate) => {
      return [...estateIds, estate.id]
    }, [])
    estates = await MatchService.getEstateForScoringQuery().whereIn('estates.id', estateIds).fetch()
    const matched = estates
      .toJSON()
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
      await Database.raw(
        `${insertQuery} ON CONFLICT (user_id, estate_id) DO UPDATE SET "percent" = EXCLUDED.percent`
      )
    }
  }

  /**
   *
   */
  static async matchByEstate(estateId) {
    // Get current estate
    const estate = await MatchService.getEstateForScoringQuery().where({ id: estateId }).first()
    // Get tenant in zone and check crossing with every tenant search zone
    let tenants = await Database.from({ _e: 'estates' })
      .select('_t.*', Database.raw(`TRUE AS inside`))
      .crossJoin({ _t: 'tenants' })
      .innerJoin({ _p: 'points' }, '_p.id', '_t.point_id')
      .where('_e.id', estateId)
      .where('_t.status', STATUS_ACTIVE)
      .whereRaw(Database.raw(`_ST_Intersects(_p.zone::geometry, _e.coord::geometry)`))
      .limit(MAX_SEARCH_ITEMS)
    const tenantUserIds = tenants.reduce(
      (tenantUserIds, tenant) => [...tenantUserIds, tenant.user_id],
      []
    )
    tenants = await MatchService.getProspectForScoringQuery()
      .whereIn('tenants.user_id', tenantUserIds)
      .fetch()
    // Calculate matches for tenants to current estate
    const matched = tenants
      .toJSON()
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
      await Database.raw(
        `${insertQuery} ON CONFLICT (user_id, estate_id) DO UPDATE SET "percent" = EXCLUDED.percent`
      )
      const superMatches = matched.filter(({ percent }) => percent >= 90)
      if (superMatches.length > 0) {
        await NoticeService.prospectSuperMatch(estateId, superMatches)
      }
    }
  }

  /**
   * Try to knock to estate
   */
  static async knockEstate(estateId, userId, knock_anyway) {
    const query = Tenant.query().where({ user_id: userId })
    if (knock_anyway) {
      query.whereIn('status', [STATUS_ACTIVE, STATUS_DRAFT])
    } else {
      query.where({ status: STATUS_ACTIVE })
    }
    const tenant = await query.first()
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

        await Database.table('matches').update({ status: MATCH_STATUS_KNOCK }).where({
          user_id: userId,
          estate_id: estateId,
        })
        return true
      }

      throw new AppException('Invalid match stage')
    }

    if (like || knock_anyway) {
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

  static async cancelKnock(estateId, userId) {
    const match = await Database.query()
      .table('matches')
      .where({ user_id: userId, status: MATCH_STATUS_KNOCK, estate_id: estateId })
      .first()

    if (!match) {
      throw new AppException('Invalid match stage')
    }

    const trx = await Database.beginTransaction()

    try {
      await Match.query().where({ user_id: userId, estate_id: estateId }).delete().transacting(trx)
      await EstateService.addDislike(userId, estateId, trx)
      await trx.commit()
      return true
    } catch (e) {
      await trx.rollback()
      throw e
    }
  }

  /**
   * Invite knocked user
   */
  static async inviteKnockedUser(estateId, userId) {
    const match = await Database.query()
      .table('matches')
      .where({ estate_id: estateId, user_id: userId, status: MATCH_STATUS_KNOCK })
      .first()

    if (!match) {
      throw new AppException('Invalid match stage')
    }

    await Database.table('matches').update({ status: MATCH_STATUS_INVITE }).where({
      user_id: userId,
      estate_id: estateId,
    })
    await NoticeService.userInvite(estateId, userId)
    MatchService.inviteEmailToProspect({ estateId, userId })
  }

  static async inviteEmailToProspect({ estateId, userId }) {
    const estate = await EstateService.getById(estateId)
    const tenant = await UserService.getById(userId)

    const lang = tenant.lang ? tenant.lang : DEFAULT_LANG

    await MailService.inviteEmailToProspect({
      email: tenant.email,
      address: estate.address,
      lang: lang,
    })
  }

  /**
   * Cancel invite if already invited
   */
  static async cancelInvite(estateId, userId) {
    const match = await Database.query()
      .table('matches')
      .where({ user_id: userId, status: MATCH_STATUS_INVITE, estate_id: estateId })
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
   * Choose available visit timeslot and move to next status
   */
  static async bookTimeslot(estateId, userId, date) {
    const getMatch = async () => {
      return Database.table('matches')
        .where({ user_id: userId, status: MATCH_STATUS_INVITE, estate_id: estateId })
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

    if (!currentTimeslot || (anotherVisit && currentTimeslot.slot_length)) {
      throw new AppException('Cant book this slot')
    }

    const endDate = currentTimeslot.slot_length
      ? moment(slotDate).add(parseInt(currentTimeslot.slot_length), 'minutes')
      : moment(slotDate).add(MINIMUM_SHOW_PERIOD, 'minutes')

    // if show end time is bigger than show time
    if (moment.utc(currentTimeslot.end_at, DATE_FORMAT) < endDate) {
      throw new AppException("can't book this time slot, out of time range!")
    }

    // Book new visit to calendar
    await Database.into('visits').insert({
      estate_id: estate.id,
      user_id: userId,
      date: slotDate.format(DATE_FORMAT),
      start_date: slotDate.format(DATE_FORMAT),
      end_date: currentTimeslot.slot_length ? endDate.format(DATE_FORMAT) : currentTimeslot.end_at,
    })
    // Move match status to next
    await Database.table('matches').update({ status: MATCH_STATUS_VISIT }).where({
      user_id: userId,
      estate_id: estateId,
    })

    // Calc booked timeslots and send notification if all booked
    const { total, booked } = await MatchService.getEstateSlotsStat(estateId)
    if (booked === total) {
      await NoticeService.landlordTimeslotsBooked(estateId, total, booked)
    }
  }

  static async updateVisitIn(estateId, userId, inviteIn = true) {
    await Database.table('matches').update({ inviteIn: inviteIn }).where({
      user_id: userId,
      estate_id: estateId,
    })
  }

  static async cancelVisit(estateId, userId) {
    const match = await Database.query()
      .table('matches')
      .where({ user_id: userId, status: MATCH_STATUS_VISIT, estate_id: estateId })
      .first()

    if (!match) {
      throw new AppException('Invalid match stage')
    }

    const deleteVisit = Database.table('visits')
      .where({ estate_id: estateId, user_id: userId })
      .delete()
    const updateMatch = Database.table('matches').update({ status: MATCH_STATUS_INVITE }).where({
      user_id: userId,
      estate_id: estateId,
    })

    await Promise.all([deleteVisit, updateMatch])

    NoticeService.cancelVisit(estateId, null, userId)
  }

  /**
   * cancel visit by landlord
   */
  static async cancelVisitByLandlord(estateId, tenantId) {
    const visit = await Database.table('visits')
      .where({ estate_id: estateId })
      .where({ user_id: tenantId })
      .first()

    if (!visit) {
      throw new AppException('there is no visit')
    }

    const deleteVisit = Database.table('visits')
      .where({ estate_id: estateId })
      .where({ user_id: tenantId })
      .delete()

    const updateMatch = Database.table('matches').update({ status: MATCH_STATUS_INVITE }).where({
      user_id: tenantId,
      estate_id: estateId,
    })

    await Promise.all([deleteVisit, updateMatch])
    NoticeService.cancelVisit(estateId, tenantId)
  }

  static async inviteTenantInToVisit(estateId, tenantId) {
    NoticeService.inviteTenantInToVisit(estateId, tenantId)
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
    return { tenantId: userTenant.id, tenantUid: userTenant.uid }
  }

  static async cancelShare(estateId, user_id) {
    const match = await Database.table('matches')
      .where({
        estate_id: estateId,
        share: true,
        user_id,
      })
      .first()
    if (!match) {
      throw new AppException('Invalid code or match status')
    }

    await Database.table('matches').update({ share: false }).where({
      user_id,
      estate_id: estateId,
    })
    NoticeService.prospectIsNotInterested(estateId)
  }

  static async matchCount(status = [MATCH_STATUS_KNOCK], estatesId) {
    return await Database.table('matches')
      .whereIn('status', status)
      .whereIn('estate_id', estatesId)
      .count('*')
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
        share: true,
      })
      .whereIn('status', [MATCH_STATUS_SHARE, MATCH_STATUS_VISIT])
  }

  static async cancelTopByTenant(estateId, tenantId) {
    const deleteMatch = Database.table('matches')
      .where({
        status: MATCH_STATUS_TOP,
        user_id: tenantId,
        estate_id: estateId,
      })
      .delete()

    const deleteVisit = Database.table('visits')
      .where({ estate_id: estateId, user_id: tenantId })
      .delete()

    const checkDislikeExist = async () => {
      const dislike = await Estate.query()
        .where('estates.id', estateId)
        .select('estates.*')
        .innerJoin({ _l: 'dislikes' }, function () {
          this.on('_l.estate_id', 'estates.id').onIn('_l.user_id', tenantId)
        })
        .first()
      if (!dislike) {
        await EstateService.addDislike(tenantId, estateId)
      }
    }

    await Promise.all([deleteMatch, deleteVisit, checkDislikeExist()])
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

  static async getFinalMatch(estateId) {
    return await Database.table('matches')
      .where({
        estate_id: estateId,
        status: MATCH_STATUS_FINISH,
      })
      .first()
  }

  static async checkMatchIsValidForFinalRequest(estateId, tenantId) {
    const match = Database.table('matches')
      .where({ status: MATCH_STATUS_TOP, share: true, user_id: tenantId, estate_id: estateId })
      .first()
    return match
  }

  static async requestFinalConfirm(estateId, tenantId) {
    const result = await Database.table('matches').update({ status: MATCH_STATUS_COMMIT }).where({
      user_id: tenantId,
      estate_id: estateId,
      status: MATCH_STATUS_TOP,
    })

    await NoticeService.prospectRequestConfirm(estateId, tenantId)
  }

  static async tenantCancelCommit(estateId, userId) {
    await Database.table('matches').update({ status: MATCH_STATUS_TOP }).where({
      user_id: userId,
      estate_id: estateId,
      status: MATCH_STATUS_COMMIT,
    })
    NoticeService.prospectIsNotInterested(estateId)
  }

  /**
   *
   */
  /**
   *
   */
  static async removeNonConfirmUserMatches(estateId, tenantId) {
    return Database.table('matches')
      .where({ user_id: tenantId })
      .whereNot(function () {
        this.where({
          user_id: tenantId,
          estate_id: estateId,
          status: MATCH_STATUS_FINISH,
        })
      })
      .delete()
  }

  static async handleFinalMatch(estate_id, user, fromInvitation, trx) {
    const estate = await EstateService.rentable(estate_id, fromInvitation)

    const existingMatch = await Database.table('matches')
      .where('user_id', user.id)
      .where('estate_id', estate_id)
      .first()

    // 2 cases:
    // There should not be a match with status finish for this user and estate
    // If the final match not from invitation, there should be match with status COMMIT
    if (
      existingMatch?.status === MATCH_STATUS_FINISH ||
      (!fromInvitation && existingMatch?.status !== MATCH_STATUS_COMMIT)
    ) {
      throw new AppException('Invalid match status')
    }

    if (existingMatch) {
      await Database.table('matches')
        .update({ status: MATCH_STATUS_FINISH })
        .where({
          user_id: user.id,
          estate_id: estate_id,
          status: existingMatch.status,
        })
        .transacting(trx)
    } else {
      await Database.table('matches')
        .insert({
          user_id: user.id,
          estate_id: estate_id,
          percent: 0,
          final_match_date: moment.utc(new Date()).format(DATE_FORMAT),
          status: MATCH_STATUS_FINISH,
        })
        .transacting(trx)
    }

    await EstateService.rented(estate_id, trx)
    await TenantService.updateTenantAddress({ user_id: user.id, address: estate.address }, trx)
    if (!fromInvitation) {
      await EstateCurrentTenantService.createOnFinalMatch(user, estate_id, trx)
    }
    return estate
  }

  /**
   * Tenant confirmed final request
   */
  static async finalConfirm(estateId, user) {
    const trx = await Database.beginTransaction()
    try {
      const estate = await MatchService.handleFinalMatch(estateId, user, false, trx)

      await trx.commit()
      NoticeService.estateFinalConfirm(estateId, user.id)
      Event.fire('mautic:syncContact', user.id, { finalmatchapproval_count: 1 })

      let contact = await estate.getContacts()
      if (contact) {
        contact = contact.toJSON()
        contact.avatar = File.getPublicUrl(contact.avatar)
      }
      return { contact, estate }
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 500)
    }
  }

  /**
   * If buddy accept invite
   */
  static async addBuddy(estate, tenantId) {
    const estateId = estate.id
    const landlordId = estate.user_id
    const buddy = await Database.table('buddies')
      .where('user_id', landlordId)
      .where('tenant_id', tenantId)
      .first()
    const tenant = await Database.table('users').where('id', tenantId).first()
    if (buddy) {
      if (buddy.status !== BUDDY_STATUS_ACCEPTED) {
      }
      await Database.table('buddies')
        .update({ status: BUDDY_STATUS_ACCEPTED })
        .where({ user_id: landlordId, tenant_id: tenantId })
    } else {
      const newBuddy = new Buddy()
      newBuddy.name = tenant.firstname
      newBuddy.phone = tenant.phone
      newBuddy.email = tenant.email
      newBuddy.user_id = landlordId
      newBuddy.tenant_id = tenantId
      newBuddy.status = BUDDY_STATUS_ACCEPTED
      await newBuddy.save()
    }

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
        status: MATCH_STATUS_NEW,
      })
    }

    if (match.buddy) {
      throw new AppException('Already applied')
    }

    // Match exists but without buddy
    return Database.table('matches').update({ buddy: true }).where({
      user_id: tenantId,
      estate_id: estateId,
    })
  }

  static getTenantTopMatchesByEstate(estateId, tenantId) {
    const query = Estate.query().select('estates.*')
    //   .where('estates.id', estateId)
    //   .innerJoin({ _m: 'matches' })
    //   .where('_m.estate_id', 'estates.id')
    //   .where('_m.user_id', tenantId)
    //   .where('_m.status', MATCH_STATUS_COMMIT)
    // return query.fetch()
  }

  static getCommitsCountByEstateExceptTenant(estateId, tenantId) {
    const query = Estate.query()
      .select('estates.*')
      .where('estates.id', estateId)
      .innerJoin({ _m: 'matches' })
      .where('_m.estate_id', 'estates.id')
      .where('_m.status', MATCH_STATUS_COMMIT)
      .whereNot('_m.user_id', tenantId)
    return query.first()
  }

  /**
   *
   */
  static getTenantMatchesWithFilterQuery(
    userId,
    { buddy, like, dislike, knock, invite, visit, share, top, commit, final }
  ) {
    const defaultWhereIn = final ? [STATUS_DRAFT] : [STATUS_ACTIVE, STATUS_EXPIRE]

    const query = Estate.query()
      .select('estates.*')
      .select('_m.percent as match')
      .select('_m.updated_at')
      .orderBy('_m.updated_at', 'DESC')
      .whereIn('estates.status', defaultWhereIn)

    if (!like && !dislike) {
      query.innerJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id').onIn('_m.user_id', userId)
      })
    }

    if (buddy) {
      // Buddy show knocked matches with buddy only for active estate
      query
        .clearWhere()
        .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])
        .where({ '_m.buddy': true, '_m.status': MATCH_STATUS_NEW })
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
      query.where({ '_m.status': MATCH_STATUS_KNOCK })
    } else if (invite) {
      query.where('_m.status', MATCH_STATUS_INVITE)
    } else if (visit) {
      query.where((query) => {
        query
          .where('_m.status', MATCH_STATUS_VISIT)
          .orWhere({ '_m.status': MATCH_STATUS_SHARE, share: true })
      })
    } else if (share) {
      query
        .where({ '_m.share': true })
        .clearOrder()
        .orderBy([
          { column: '_m.order_tenant', order: 'ASK' },
          { column: '_m.updated_at', order: 'DESC' },
        ])
    } else if (top) {
      query
        .where({ '_m.status': MATCH_STATUS_TOP, share: true })
        .clearOrder()
        .orderBy([
          { column: '_m.order_tenant', order: 'ASK' },
          { column: '_m.updated_at', order: 'DESC' },
        ])
    } else if (commit) {
      query
        .innerJoin({ _u: 'users' }, '_u.id', 'estates.user_id')
        .select('_u.email', '_u.phone', '_u.avatar', '_u.firstname', '_u.secondname')
        .whereIn('_m.status', [MATCH_STATUS_COMMIT])
        .where('_m.share', true)
    } else if (final) {
      query
        .innerJoin({ _u: 'users' }, '_u.id', 'estates.user_id')
        .select('_u.email', '_u.phone', '_u.avatar', '_u.firstname', '_u.secondname', '_u.sex')
        .whereIn('_m.status', [MATCH_STATUS_FINISH])
    } else {
      throw new AppException('Invalid filter params')
    }

    query.leftJoin({ _v: 'visits' }, function () {
      this.on('_v.user_id', '_m.user_id').on('_v.estate_id', '_m.estate_id')
    })

    query.select(
      'estates.user_id',
      'estates.street',
      'estates.city',
      'estates.zip',
      'estates.available_date',
      'estates.status as estate_status',
      '_m.status as status',
      '_m.buddy',
      '_m.share',
      '_v.date',
      '_v.start_date AS visit_start_date',
      '_v.end_date AS visit_end_date',
      '_v.tenant_status AS visit_status',
      '_v.tenant_delay AS delay'
    )
    return query
  }

  static getTenantUpcomingVisits(userId) {
    const now = moment().format(DATE_FORMAT)
    const query = Estate.query()
      .select('estates.*')
      .select('_m.percent as match')
      .select('_m.updated_at')
      .orderBy('_m.updated_at', 'DESC')
      .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])

    query.innerJoin({ _m: 'matches' }, function () {
      this.on('_m.estate_id', 'estates.id')
        .onIn('_m.user_id', userId)
        .on('_m.status', MATCH_STATUS_VISIT)
    })
    query.leftJoin({ _v: 'visits' }, function () {
      this.on('_v.user_id', '_m.user_id').on('_v.estate_id', '_m.estate_id')
    })

    query.select(
      'estates.user_id',
      'estates.street',
      'estates.city',
      'estates.zip',
      'estates.status as estate_status',
      '_m.status as status',
      '_m.buddy',
      '_m.share',
      '_v.date',
      '_v.start_date AS visit_start_date',
      '_v.end_date AS visit_end_date',
      '_v.tenant_status AS visit_status',
      '_v.tenant_delay AS delay'
    )
    query.where('_v.date', '>', now)
    return query
  }

  static getLandlordUpcomingVisits(userId) {
    const now = moment().format(DATE_FORMAT)

    const query = Estate.query()
      .select('time_slots.*', 'estates.*')
      .select(Database.raw('COUNT(visits)::int as visitCount'))
      .where('estates.user_id', userId)
      .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])
      .leftJoin('time_slots', function () {
        this.on('estates.id', 'time_slots.estate_id')
      })
      .where('time_slots.start_at', '>=', now)
      .leftJoin('visits', function () {
        this.on('visits.start_date', '>=', 'time_slots.start_at')
          .on('visits.end_date', '<=', 'time_slots.end_at')
          .on('visits.estate_id', '=', 'estates.id')
      })
      .groupBy('time_slots.id', 'estates.id')
      .orderBy('time_slots.end_at', 'ASC')
      .fetch()

    return query
  }

  static async getMatchesCountsTenant(userId) {
    const estates = await Estate.query()
      .select('status', 'id')
      .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])
      .fetch()
    const estatesJson = estates.toJSON({ isShort: true })
    const estateIds = estatesJson.map(function (item) {
      return item['id']
    })
    const datas = await Promise.all([
      this.getTenantLikesCount(userId, estateIds),
      this.getTenantDislikesCount(userId, estateIds),
      this.getTenantKnocksCount(userId, estateIds),
      this.getTenantSharesCount(userId, estateIds),
      this.getTenantInvitesCount(userId, estateIds),
      this.getTenantVisitsCount(userId, estateIds),
      this.getTenantCommitsCount(userId, estateIds),
      this.getTenantTopsCount(userId, estateIds),
      this.getTenantBuddiesCount(userId, estateIds),
      this.getTenantFinalMatchesCount(userId),
    ])
    const [{ count: likesCount }] = datas[0]
    const [{ count: dislikesCount }] = datas[1]
    const [{ count: knocksCount }] = datas[2]
    const [{ count: sharesCount }] = datas[3]
    const [{ count: invitesCount }] = datas[4]
    const [{ count: visitsCount }] = datas[5]
    const [{ count: commitsCount }] = datas[6]
    const [{ count: topsCount }] = datas[7]
    const [{ count: buddiesCount }] = datas[8]
    const [{ count: finalMatchesCount }] = datas[9]
    return {
      like: parseInt(likesCount),
      dislike: parseInt(dislikesCount),
      knock: parseInt(knocksCount),
      share: parseInt(sharesCount),
      visit: parseInt(parseInt(invitesCount) + parseInt(visitsCount)),
      commit: parseInt(commitsCount),
      decide: parseInt(commitsCount) + parseInt(topsCount),
      buddy: parseInt(buddiesCount),
      final: parseInt(finalMatchesCount),
    }
  }

  static async getMatchesStageCountsTenant(filter, userId) {
    const estates = await Estate.query()
      .select('status', 'id')
      .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])
      .fetch()
    const estatesJson = estates.toJSON({ isShort: true })
    const estateIds = estatesJson.map(function (item) {
      return item['id']
    })
    if (filter === 'visit') {
      const datas = await Promise.all([
        MatchService.getTenantInvitesCount(userId, estateIds),
        MatchService.getTenantVisitsCount(userId, estateIds),
      ])
      const [{ count: invitesCount }] = datas[0]
      const [{ count: visitsCount }] = datas[1]
      return {
        invite: parseInt(invitesCount),
        visit: parseInt(visitsCount),
        stage: parseInt(invitesCount) + parseInt(visitsCount),
      }
    } else if (filter === 'decide') {
      const datas = await Promise.all([
        MatchService.getTenantTopsCount(userId, estateIds),
        MatchService.getTenantCommitsCount(userId, estateIds),
      ])
      const [{ count: topsCount }] = datas[0]
      const [{ count: commitsCount }] = datas[1]
      return {
        top: parseInt(topsCount),
        commit: parseInt(commitsCount),
        stage: parseInt(topsCount) + parseInt(commitsCount),
      }
    } else {
      throw new HttpException('Invalid stage', 400)
    }
  }

  static async getTenantLikesCount(userId) {
    const estates = await Estate.query()
      .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])
      .select('estates.*')
      .innerJoin({ _l: 'likes' }, function () {
        this.on('_l.estate_id', 'estates.id').onIn('_l.user_id', userId)
      })
      .leftJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id').onIn('_m.user_id', userId)
      })
      .where(function () {
        this.orWhere('_m.status', MATCH_STATUS_NEW).orWhereNull('_m.status')
      })
      .fetch()
    return [{ count: estates.rows.length }]
  }

  static async getTenantDislikesCount(userId) {
    const estates = await Estate.query()
      .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])
      .select('estates.*')
      .innerJoin({ _l: 'dislikes' }, function () {
        this.on('_l.estate_id', 'estates.id').onIn('_l.user_id', userId)
      })
      .leftJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id').onIn('_m.user_id', userId)
      })
      .where(function () {
        this.orWhere('_m.status', MATCH_STATUS_NEW).orWhereNull('_m.status')
      })
      .fetch()

    const trashEstates = await EstateService.getTenantTrashEstates(userId)

    return [{ count: estates.rows.length + trashEstates.rows.length }]
  }

  static async getTenantKnocksCount(userId, estateIds) {
    const data = await Database.table('matches')
      .where({ user_id: userId, status: MATCH_STATUS_KNOCK })
      .whereIn('estate_id', estateIds)
      .count('*')
    return data
  }

  static async getTenantInvitesCount(userId, estateIds) {
    const data = await Database.table('matches')
      .where({ user_id: userId, status: MATCH_STATUS_INVITE })
      .whereIn('estate_id', estateIds)
      .count('*')
    return data
  }

  static async getTenantVisitsCount(userId, estateIds) {
    const data = await Database.table('matches')
      .where((query) => {
        query
          .where('user_id', userId)
          .where('status', MATCH_STATUS_VISIT)
          .whereIn('estate_id', estateIds)
      })
      .orWhere((query) => {
        query
          .where('user_id', userId)
          .where({ status: MATCH_STATUS_SHARE, share: true })
          .whereIn('estate_id', estateIds)
      })
      .count('*')

    return data
  }

  static async getTenantSharesCount(userId, estateIds) {
    const data = await Database.table('matches')
      .where({ user_id: userId, share: true })
      .whereIn('estate_id', estateIds)
      .count('*')
    return data
  }

  static async getTenantTopsCount(userId, estateIds) {
    const data = await Database.table('matches')
      .where({ user_id: userId, status: MATCH_STATUS_TOP, share: true })
      .whereIn('estate_id', estateIds)
      .count('*')
    return data
  }

  static async getTenantCommitsCount(userId, estateIds) {
    const data = await Database.table('matches')
      .where({ user_id: userId, status: MATCH_STATUS_COMMIT, share: true })
      .whereIn('estate_id', estateIds)
      .count('*')
    return data
  }

  static async getTenantFinalMatchesCount(userId) {
    const data = await Database.table('matches')
      .where({ user_id: userId, status: MATCH_STATUS_FINISH })
      .count('*')
    return data
  }

  static async getTenantBuddiesCount(userId, estateIds) {
    const data = await Database.table('matches')
      .where({ user_id: userId, buddy: true, status: MATCH_STATUS_NEW })
      .whereIn('estate_id', estateIds)
      .count('*')
    return data
  }

  static searchForTenant(userId, params = {}) {
    const query = Estate.query()
      .select('estates.*')
      .select('_m.percent as match')
      .select('_m.updated_at')
      .orderBy('_m.updated_at', 'DESC')
      .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])

    query.innerJoin({ _m: 'matches' }, function () {
      this.on('_m.estate_id', 'estates.id').onIn('_m.user_id', userId)
    })
    query.leftJoin({ _l: 'likes' }, function () {
      this.on('_l.estate_id', 'estates.id').onIn('_l.user_id', userId)
    })
    query.leftJoin({ _d: 'dislikes' }, function () {
      this.on('_d.estate_id', 'estates.id').onIn('_d.user_id', userId)
    })
    query.leftJoin({ _v: 'visits' }, function () {
      this.on('_v.user_id', '_m.user_id').on('_v.estate_id', '_m.estate_id')
    })
    if (params.query) {
      query.where(function () {
        this.orWhere('estates.street', 'ilike', `%${params.query}%`)
        this.orWhere('estates.property_id', 'ilike', `${params.query}%`)
      })
    }
    query.select(
      'estates.user_id',
      'estates.street',
      'estates.city',
      'estates.zip',
      'estates.status as estate_status',
      '_m.status as status',
      '_m.buddy',
      '_m.share',
      '_v.date',
      '_v.start_date AS visit_start_date',
      '_v.end_date AS visit_end_date',
      '_v.lord_status AS visit_status',
      '_v.lord_delay AS delay',
      '_l AS like',
      '_d AS dislike'
    )
    return query
  }

  static searchForLandlord(userId, searchQuery) {
    const query = EstateService.getEstates()
      .select('*')
      .where('estates.user_id', userId)
      .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])

    if (searchQuery) {
      query.where(function () {
        this.orWhere('estates.street', 'ilike', `%${searchQuery}%`)
        this.orWhere('estates.address', 'ilike', `%${searchQuery}%`)
        this.orWhere('estates.property_id', 'ilike', `%${searchQuery}%`)
      })
    }

    return query.fetch()
  }

  /**
   * Get tenants matched to current estate
   */
  static getLandlordMatchesWithFilterQuery(
    estate,
    { knock, buddy, invite, visit, top, commit, final }
  ) {
    const query = Tenant.query()
      .select([
        'tenants.*',
        '_u.firstname',
        '_u.secondname',
        '_u.birthday',
        '_u.email',
        '_u.avatar',
      ])
      .select('_m.updated_at', '_m.percent as percent', '_m.share', '_m.inviteIn')
      .select('_u.email', '_u.phone', '_u.status as u_status')
      .select(`_pm.profession`)
      .select(`_mf.id_verified`)
      .select(
        Database.raw(`
        (case when _bd.user_id is null
          then
            'match'
          else
            'buddy'
          end
        ) as match_type`)
      )
      .select(
        Database.raw(`
        -- null here indicates members did not submit any income
        (_ip.all_members_submitted_income_proofs::int
        + _mp.all_members_submitted_no_rent_arrears_proofs::int
        + _mp.all_members_submitted_credit_score_proofs::int)
        as total_completed_proofs`)
      )
      .select(
        Database.raw(`
        json_build_object
          (
            'income', all_members_submitted_income_proofs,
            'credit_score', all_members_submitted_credit_score_proofs,
            'no_rent_arrears', all_members_submitted_no_rent_arrears_proofs
          )
        as submitted_proofs
        `)
      )
      .innerJoin({ _u: 'users' }, 'tenants.user_id', '_u.id')
      .where({ '_u.role': ROLE_USER })
      .innerJoin({ _m: 'matches' }, function () {
        this.on('_m.user_id', '_u.id').onIn('_m.estate_id', [estate.id])
      })
      .orderBy('_m.updated_at', 'DESC')

    if (knock) {
      query.where({ '_m.status': MATCH_STATUS_KNOCK })
    } else if (buddy) {
      query.where({ '_m.status': MATCH_STATUS_NEW, '_m.buddy': true })
    } else if (invite) {
      query.whereIn('_m.status', [MATCH_STATUS_INVITE])
    } else if (visit) {
      query.whereIn('_m.status', [MATCH_STATUS_VISIT, MATCH_STATUS_SHARE])
    } else if (top) {
      query
        .where('_m.status', MATCH_STATUS_TOP)
        .clearOrder()
        .orderBy([
          { column: '_m.order_lord', order: 'ASC' },
          { column: '_m.updated_at', order: 'DESC' },
        ])
    } else if (commit) {
      query.whereIn('_m.status', [MATCH_STATUS_COMMIT, MATCH_STATUS_FINISH])
    } else if (final) {
      query.whereIn('_m.status', [MATCH_STATUS_FINISH])
    }

    query
      .leftJoin({ _v: 'visits' }, function () {
        this.on('_v.user_id', '_m.user_id').on('_v.estate_id', '_m.estate_id')
      })
      .leftJoin({ _mb: 'members' }, function () {
        //primaryUser?
        this.on('_mb.user_id', '_m.user_id').onIn('_mb.id', function () {
          this.min('id')
            .from('members')
            .where('user_id', Database.raw('_m.user_id'))
            .whereNot('child', true)
            .limit(1)
        })
      })
      .leftJoin(
        //members have proofs for credit_score and no_rent_arrears
        Database.raw(`
        (select
          members.user_id,
          count(*) as member_count,
          bool_and(case when members.rent_arrears_doc is not null then true else false end) as all_members_submitted_no_rent_arrears_proofs,
          bool_and(case when members.debt_proof is not null then true else false end) as all_members_submitted_credit_score_proofs
        from
          members
        group by
          members.user_id)
        as _mp
        `),
        function () {
          this.on('_mp.user_id', '_m.user_id')
        }
      )
      .leftJoin(
        //all members have proofs for income
        Database.raw(`
        -- table indicating all members under prospect submitted complete income proofs
        (-- tenant has members
          select
            members.user_id,
            sum(member_total_income) as total_income,
            coalesce(bool_and(_mi.incomes_has_all_proofs), false) as all_members_submitted_income_proofs
          from
            members
          left join
            (
            -- if member has all proofs, get also member's total income
            select
              incomes.member_id,
              sum(_mip.income) as member_total_income,
              bool_and(submitted_proofs >= 3) as incomes_has_all_proofs
            from
              incomes
            left join
              (
              -- how many proofs are submitted for each income
              select
                incomes.id,
                incomes.income as income,
                incomes.member_id,
                count(income_proofs.file) as submitted_proofs
              from
                incomes
              left join
                income_proofs
              on
                income_proofs.income_id = incomes.id
              group by incomes.id) as _mip
            on
              _mip.id=incomes.id
            group by
              incomes.id
            ) as _mi
          on _mi.member_id=members.id
          group by
            members.user_id
            ) as _ip`),
        function () {
          this.on('_ip.user_id', '_m.user_id')
        }
      )
      .leftJoin(
        //profession of primaryMember
        Database.raw(`
        (select
          (array_agg(primaryMember.user_id))[1] as user_id,
          incomes.member_id,
          (array_agg(incomes.income_type order by incomes.income desc))[1] as profession
        from
          members as primaryMember
        left join
          incomes
        on
          primaryMember.id=incomes.member_id
        and
          primaryMember.email is null
        and
          primaryMember.owner_user_id is null
        group by
          incomes.member_id)
        as _pm
      `),
        function () {
          this.on('tenants.user_id', '_pm.user_id')
        }
      )
      .leftJoin({ _bd: 'buddies' }, function () {
        this.on('tenants.user_id', '_bd.tenant_id').on('_bd.user_id', estate.user_id)
      })
      .leftJoin(
        Database.raw(`
          (select
            members.user_id,
            bool_and(member_has_id) as id_verified
          from members
          left join
            (select
              member_files.member_id,
              count(member_files.file) > 0 as member_has_id
            from
              member_files
            where member_files.status = ${STATUS_ACTIVE} and member_files.type='${MEMBER_FILE_TYPE_PASSPORT}'
            group by
              member_files.member_id
            ) as mf
          on mf.member_id=members.id
          group by members.user_id)
        as _mf`),
        function () {
          this.on('_mf.user_id', '_m.user_id')
        }
      )
    query.select(
      '_mb.firstname',
      '_mb.secondname',
      '_mb.birthday',
      '_mb.avatar',
      '_mb.last_address',
      '_mb.phone_verified',
      '_v.date',
      '_v.start_date AS visit_start_date',
      '_v.end_date AS visit_end_date',
      '_v.created_at AS visit_confirmation_date',
      '_v.tenant_status AS visit_status',
      '_v.tenant_delay AS delay',
      '_m.buddy',
      '_m.share as share',
      '_m.status as status',
      '_m.user_id',
      '_mf.id_verified'
    )

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

  /**
   *
   */
  static async getTenantLastTab(userId) {
    // buddy, like, dislike, knock, invite, share, top, commit
    const data = await Database.table('matches')
      .select('status')
      .select(Database.raw(`bool_or(buddy) as buddy`))
      .select(Database.raw(`bool_or("share") as share`))
      .where({ user_id: userId })
      .groupBy('status')
      .orderBy('status', 'desc')
      .first()
    if (!data) {
      return TENANT_TABS_KNOCK
    }

    if (data.status === MATCH_STATUS_NEW) {
      if (data.buddy) {
        return TENANT_TABS_BUDDY
      } else {
        return TENANT_TABS_KNOCK
      }
    } else if ([MATCH_STATUS_INVITE, MATCH_STATUS_VISIT].includes(data.status)) {
      return TENANT_TABS_INVITE
    } else if (data.status === MATCH_STATUS_SHARE) {
      return TENANT_TABS_SHARE
    } else if (data.status === MATCH_STATUS_TOP) {
      return TENANT_TABS_TOP
    } else if ([MATCH_STATUS_COMMIT, MATCH_STATUS_FINISH].includes(data.status)) {
      return TENANT_TABS_COMMIT
    } else {
      return TENANT_TABS_LIKE
    }
  }

  /**
   *
   */
  static async getLandlordLastTab(estate_id) {
    // filters = { knock, buddy, invite, visit, top, commit }
    const data = await Database.table('matches')
      .select('status')
      .select(Database.raw(`bool_or(buddy) as buddy`))
      .select(Database.raw(`bool_or("share") as share`))
      .where({ estate_id: estate_id })
      .groupBy('status')
      .orderBy('status', 'desc')
      .first()
    if (!data) {
      return LANDLORD_TABS_KNOCK
    }

    if (data.status === MATCH_STATUS_NEW) {
      if (data.buddy) {
        return LANDLORD_TABS_BUDDY
      } else {
        return LANDLORD_TABS_KNOCK
      }
    } else if (data.status === MATCH_STATUS_INVITE) {
      return LANDLORD_TABS_INVITE
    } else if ([MATCH_STATUS_SHARE, MATCH_STATUS_VISIT].includes(data.status)) {
      return LANDLORD_TABS_VISIT
    } else if (data.status === MATCH_STATUS_TOP) {
      return LANDLORD_TABS_TOP
    } else if ([MATCH_STATUS_COMMIT, MATCH_STATUS_FINISH].includes(data.status)) {
      return LANDLORD_TABS_COMMIT
    }

    return LANDLORD_TABS_KNOCK
  }

  /**
   *
   */
  static async getEstateSlotsStat(estateId) {
    const slotWithoutLength = await Database.table('time_slots')
      .select('slot_length')
      .where('estate_id', estateId)
      .whereNull('slot_length')
      .first()

    // It means there is unlimited slot, if there is at least 1 time_slot that slot_length = 0
    if (slotWithoutLength) {
      return { total: 1, booked: 0 }
    }

    // All available slots for estate
    const getAvailableSlots = () => {
      return Database.select('slot_length', 'start_at', 'end_at')
        .table('time_slots')
        .where('estate_id', estateId)
    }

    // Booked slots for estate
    const getBookedSlots = async () => {
      const data = await Database.table('visits').count('*').where('estate_id', estateId).first()
      return parseInt(data.count)
    }

    // Get data
    const { slots, bookedSlotsCount } = await props({
      slots: getAvailableSlots(),
      bookedSlotsCount: getBookedSlots(),
    })

    // Calculate sum of all available slots
    const totalSlotsCount = slots.reduce((n, { slot_length, start_at, end_at }) => {
      return n + Math.floor(moment.utc(end_at).diff(moment.utc(start_at), 'minutes') / slot_length)
    }, 0)

    return { total: totalSlotsCount, booked: bookedSlotsCount }
  }

  /**
   *
   */
  static async updateVisitStatus(estateId, userId, data) {
    await Database.table('visits').where({ estate_id: estateId, user_id: userId }).update(data)
    const estate = await EstateService.getActiveById(estateId)
    if (estate) {
      if (data.tenant_delay) {
        NoticeService.changeVisitTime(estateId, estate.user_id, data.tenant_delay, userId)
      } else if (data.tenant_status === TIMESLOT_STATUS_CONFIRM) {
        NoticeService.prospectArrived(estateId, userId)
      }
    } else {
      throw new AppException('No estate')
    }
  }

  /**
   *
   */
  static async updateVisitStatusLandlord(estateId, user_id, data) {
    const currentDay = moment().startOf('day')
    try {
      //TODO: handle this flow. seems wrong
      const visit = await Visit.query()
        .where({ estate_id: estateId, user_id })
        .where('date', '>', currentDay.format(DATE_FORMAT))
        .where('date', '<=', currentDay.clone().add(1, 'days').format(DATE_FORMAT))
        .first()

      await Database.table('visits')
        .where({ estate_id: estateId, user_id: user_id })
        .where('date', '>', currentDay.format(DATE_FORMAT))
        .where('date', '<=', currentDay.clone().add(1, 'days').format(DATE_FORMAT))
        .update(data)
      if (visit && visit.lord_delay) {
        NoticeService.changeVisitTime(estateId, visit.user_id, visit.lord_delay, null)
      }
    } catch (e) {
      Logger.error(e)
      throw new AppException(e)
    }
  }

  /**
   *
   */
  static async inviteUserToCome(estateId, userId) {
    const currentDay = moment().startOf('day')
    await Database.table('visits')
      .where({ estate_id: estateId, user_id: userId })
      .where('date', '>', currentDay.format(DATE_FORMAT))
      .where('date', '<=', currentDay.clone().add(1, 'days').format(DATE_FORMAT))
      .update('lord_status', TIMESLOT_STATUS_COME)

    await NoticeService.inviteUserToCome(estateId, userId)
  }

  static async findCurrentTenant(estateId, userId) {
    const finalMatch = await Match.query()
      .select(['estate_id', 'user_id', 'email', 'phone'])
      .innerJoin({ _u: 'users' }, function () {
        this.on('_u.id', 'matches.user_id').onIn('_u.id', userId)
      })
      .where('estate_id', estateId)
      .where('matches.user_id', userId)
      .where('matches.status', MATCH_STATUS_FINISH)
      // .with('user')
      .firstOrFail()

    return finalMatch
  }

  static async invitedTenant(estateId, userId, inviteTo) {
    return await Match.query()
      .where('estate_id', estateId)
      .where('user_id', userId)
      .update({ inviteToEdit: inviteTo })
  }

  static async hasPermissionToEditProperty(estateId, userId) {
    return await Match.query()
      .where('estate_id', estateId)
      .where('user_id', userId)
      .where('status', MATCH_STATUS_FINISH)
      .whereNotNull('inviteToEdit')
      .firstOrFail()
  }

  static async isExist(user_id, estate_id, tenant_id) {
    try {
      return await Match.query()
        .innerJoin({ _e: 'estates' }, function () {
          this.on('_e.id', 'matches.estate_id').on('_e.user_id', user_id).on('_e.id', estate_id)
        })
        .where('estate_id', estate_id)
        .where('matches.user_id', tenant_id)
        .firstOrFail()
    } catch (e) {
      return null
    }
  }

  static async addTenantProperty(data) {
    return await Match.query()
      .where('estate_id', data.estate_id)
      .where('user_id', data.user_id)
      .update({ properties: data.properties, prices: data.prices })
  }

  static getEstateForScoringQuery() {
    return Estate.query()
      .select(
        'estates.id',
        'budget',
        'credit_score',
        'rent_arrears',
        'min_age',
        'max_age',
        'family_size_min',
        'family_size_max',
        'pets',
        'net_rent',
        'rooms_number',
        'number_floors',
        'house_type',
        'vacant_date',
        'amenities.options',
        'area',
        'apt_type'
      )
      .leftJoin(
        Database.raw(`
        (select estate_id, json_agg(option_id) as options
        from amenities where type='amenity' and location in
        ('building', 'apartment', 'vicinity') group by estate_id) as amenities
        `),
        function () {
          this.on('amenities.estate_id', 'estates.id')
        }
      )
  }

  static getProspectForScoringQuery() {
    return Tenant.query()
      .select(
        'tenants.id',
        'tenants.user_id',
        Database.raw(`_me.total_income as income`), //sum of all member's income
        '_m.credit_score', //average
        'rent_arrears', //if at least one has true, then true
        '_me.income_proofs', //all members must submit at least 3 income proofs for each of their incomes for this to be true
        '_m.credit_score_proofs', //all members must submit their credit score proofs
        '_m.no_rent_arrears_proofs', //all members must submit no_rent_arrears_proofs
        '_m.members_age',
        '_m.members_count', //adult members only
        'pets',
        'budget_max',
        'rent_start',
        'options', //array
        'space_min',
        'space_max',
        'floor_min',
        'floor_max',
        'rooms_min',
        'rooms_max',
        'house_type', //array
        'apt_type' //array
      )
      .leftJoin(
        //members...
        Database.raw(`
      (select
        user_id,
        avg(credit_score) as credit_score,
        count(id) as members_count,
        bool_and(coalesce(debt_proof, '') <> '') as credit_score_proofs,
        bool_and(coalesce(rent_arrears_doc, '') <> '') as no_rent_arrears_proofs,
        bool_or(coalesce(unpaid_rental, 0) > 0) as rent_arrears,
        -- sum(income) as income,
        json_agg(extract(year from age(${Database.fn.now()}, birthday)) :: int) as members_age
      from members
      group by user_id
      ) as _m
      `),
        function () {
          this.on('tenants.user_id', '_m.user_id')
        }
      )
      .leftJoin(
        //members incomes and income_proofs
        Database.raw(`
        (-- tenant has members
          select
            members.user_id,
            sum(member_total_income) as total_income,
            coalesce(bool_and(_mi.incomes_has_all_proofs), false) as income_proofs
          from
            members
          left join
            (
            -- whether or not member has all proofs, get also member's total income
            select
              incomes.member_id,
              sum(_mip.income) as member_total_income,
              bool_and(submitted_proofs >= 3) as incomes_has_all_proofs
            from
              incomes
            left join
              (
              -- how many proofs are submitted for each income
              select
                incomes.id,
                incomes.income as income,
                incomes.member_id,
                count(income_proofs.file) as submitted_proofs
              from
                incomes
              left join
                income_proofs
              on
                income_proofs.income_id = incomes.id
              group by incomes.id) as _mip
            on
              _mip.id=incomes.id
            group by
              incomes.id
            ) as _mi
          on _mi.member_id=members.id
          group by
            members.user_id
        ) as _me`),
        function () {
          this.on('_me.user_id', '_m.user_id')
        }
      )
  }

  static async recalculateMatchScoresByUserId(userId, trx) {
    let matches = await Match.query().where('user_id', userId).fetch()
    matches = matches.toJSON()
    if (isEmpty(matches)) {
      return
    }
    const prospect = await MatchService.getProspectForScoringQuery()
      .where('tenants.user_id', userId)
      .first()
    const estateIds = matches.reduce((estateIds, match) => {
      return [...estateIds, match.estate_id]
    }, [])
    let estates = await MatchService.getEstateForScoringQuery()
      .whereIn('estates.id', estateIds)
      .fetch()
    const matchScores = estates
      .toJSON()
      .reduce((n, v) => {
        const percent = MatchService.calculateMatchPercent(prospect, v)
        return [...n, { estate_id: v.id, percent }]
      }, [])
      .map((i) => ({
        user_id: userId,
        estate_id: i.estate_id,
        percent: i.percent,
      }))

    if (!isEmpty(matchScores)) {
      const insertQuery = Database.query().into('matches').insert(matchScores).toString()
      await Database.raw(
        `${insertQuery} ON CONFLICT (user_id, estate_id) DO UPDATE SET "percent" = EXCLUDED.percent`
      ).transacting(trx)
    }
  }

  static async getMatches(userId, estateId) {
    return await Match.query().where({ user_id: userId, estate_id: estateId }).first()
  }

  static async handleDeletedTimeSlotVisits({ estate_id, start_at, end_at }, trx) {
    const visits = await Visit.query()
      .where('estate_id', estate_id)
      .where('start_date', '>=', start_at)
      .where('end_date', '<=', end_at)
      .fetch()

    if (isEmpty(visits)) {
      return
    }

    const userIds = visits.rows.map(({ user_id }) => user_id)

    for (const visit of visits.rows) {
      await Visit.query()
        .where('start_date', visit.start_date)
        .where('end_date', visit.end_date)
        .where('user_id', visit.user_id)
        .where('estate_id', visit.estate_id)
        .delete()
        .transacting(trx)
    }

    await Database.table('matches')
      .whereIn('user_id', userIds)
      .where({ estate_id })
      .update({ status: MATCH_STATUS_INVITE })
      .transacting(trx)

    return userIds
  }

  static async getEstatesByStatus({ estate_id, status }) {
    let query = Match.query()
    if (estate_id) {
      query.where('id', estate_id)
    }
    if (status) {
      query.where('status', status)
    }
    return (await query.fetch()).rows
  }

  static async getMatchCount(id) {
    return await this.matchCount(
      [
        MATCH_STATUS_KNOCK,
        MATCH_STATUS_INVITE,
        MATCH_STATUS_VISIT,
        MATCH_STATUS_SHARE,
        MATCH_STATUS_COMMIT,
        MATCH_STATUS_TOP,
        MATCH_STATUS_FINISH,
      ],
      [id]
    )
  }
}

module.exports = MatchService
