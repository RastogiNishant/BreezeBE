const uuid = require('uuid')
const moment = require('moment')
const {
  get,
  isNumber,
  isEmpty,
  intersection,
  countBy,
  groupBy,
  uniqBy,
  isEqual
} = require('lodash')
const { props } = require('bluebird')
const Promise = require('bluebird')
const Database = use('Database')
const Estate = use('App/Models/Estate')
const Match = use('App/Models/Match')
const User = use('App/Models/User')
const Visit = use('App/Models/Visit')
const Dislike = use('App/Models/Dislike')
const Logger = use('Logger')
const Tenant = use('App/Models/Tenant')
const UserService = use('App/Services/UserService')
const EstateService = use('App/Services/EstateService')
const MailService = use('App/Services/MailService')
const NoticeService = use('App/Services/NoticeService')
const GeoService = use('App/Services/GeoService')
const AppException = use('App/Exceptions/AppException')
const HttpException = use('App/Exceptions/HttpException')
const Buddy = use('App/Models/Buddy')
const { max, min } = require('lodash')
const Event = use('Event')
const File = use('App/Classes/File')
const Ws = use('Ws')
const EstateCurrentTenantService = use('App/Services/EstateCurrentTenantService')
const EstateAmenityService = use('App/Services/EstateAmenityService')
const TenantService = use('App/Services/TenantService')
const MatchFilters = require('../Classes/MatchFilters')
const EstateFilters = require('../Classes/EstateFilters')
const WebSocket = use('App/Classes/Websocket')
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
  DEFAULT_LANG,
  TIMESLOT_STATUS_REJECT,
  STATUS_DELETE,
  ROLE_LANDLORD,
  WEBSOCKET_EVENT_MATCH,
  NO_MATCH_STATUS,
  MATCH_SCORE_GOOD_MATCH,
  INCOME_TYPE_EMPLOYEE,
  INCOME_TYPE_WORKER,
  INCOME_TYPE_UNEMPLOYED,
  INCOME_TYPE_CIVIL_SERVANT,
  INCOME_TYPE_FREELANCER,
  INCOME_TYPE_HOUSE_WORK,
  INCOME_TYPE_PENSIONER,
  INCOME_TYPE_SELF_EMPLOYED,
  INCOME_TYPE_TRAINEE,
  WEBSOCKET_EVENT_MATCH_STAGE,
  PROPERTY_TYPE_SHORT_TERM,
  MATCH_PERCENT_PASS,
  WEBSOCKET_EVENT_MATCH_CREATED,
  STATUS_OFFLINE_ACTIVE,
  TASK_SYSTEM_TYPE,
  NOTICE_TYPE_LANDLORD_MIN_PROSPECTS_REACHED_ID,
  NOTICE_TYPE_LANDLORD_GREEN_MIN_PROSPECTS_REACHED_ID,
  MATCH_TYPE_BUDDY,
  MATCH_TYPE_MATCH,
  WEBSOCKET_TENANT_REDIS_KEY,
  EXPIRED_FINAL_CONFIRM_PERIOD,
  WEBSOCKET_EVENT_MATCH_COUNT,
  YES_UNPAID_RENTAL,
  INCOME_TYPE_CHILD_BENEFIT,
  INCOME_TYPE_OTHER_BENEFIT,
  CREDIT_HISTORY_STATUS_NO_NEGATIVE_DATA
} = require('../constants')

const ThirdPartyMatchService = require('./ThirdPartyMatchService')
const {
  exceptions: {
    ESTATE_NOT_EXISTS,
    WRONG_PROSPECT_CODE,
    TIME_SLOT_NOT_FOUND,
    NO_ESTATE_EXIST,
    NO_MATCH_EXIST,
    UNSECURE_PROFILE_SHARE,
    ERROR_COMMIT_MATCH_INVITE,
    ERROR_ALREADY_MATCH_INVITE,
    ERROR_MATCH_COMMIT_DOUBLE,
    USER_NOT_EXIST
  },
  exceptionCodes: {
    WRONG_PROSPECT_CODE_ERROR_CODE,
    NO_TIME_SLOT_ERROR_CODE,
    ERROR_COMMIT_MATCH_INVITE_CODE,
    ERROR_ALREADY_MATCH_INVITE_CODE,
    ERROR_MATCH_COMMIT_DOUBLE_CODE
  }
} = require('../exceptions')
const QueueService = require('./QueueService')

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
  static async calculateMatchPercent(prospect, estate) {
    const vacant_date = estate.vacant_date
    const rent_end_at = estate.rent_end_at

    //short duration filter doesn't meet, match percent will be 0
    if (prospect.residency_duration_min && prospect.residency_duration_max) {
      // if it's inside property
      if (!estate.source_id) {
        if (!vacant_date || !rent_end_at) {
          return {
            percent: 0,
            landlord_score: 0,
            prospect_score: 0
          }
        }

        const rent_duration = moment(rent_end_at).format('x') - moment(vacant_date).format('x')
        if (
          rent_duration < prospect.residency_duration_min * 24 * 60 * 60 * 1000 ||
          rent_duration > prospect.residency_duration_max * 24 * 60 * 60 * 1000
        ) {
          return {
            percent: 0,
            landlord_score: 0,
            prospect_score: 0
          }
        }
      } else {
        if (estate.property_type !== PROPERTY_TYPE_SHORT_TERM) {
          return {
            percent: 0,
            landlord_score: 0,
            prospect_score: 0
          }
        }
      }
    }
    const incomes =
      prospect.incomes ?? (await require('./MemberService').getIncomes(prospect.user_id))
    if (!incomes?.length) {
      return {
        percent: 0,
        landlord_score: 0,
        prospect_score: 0
      }
    }

    const income_types = incomes.map((ic) => ic.income_type)
    const isExistIncomeSource = estate.income_sources.some((ic) => income_types.includes(ic))
    if (!isExistIncomeSource) {
      return {
        percent: 0,
        landlord_score: 0,
        prospect_score: 0
      }
    }

    const scoreLPer = MatchService.calculateLandlordScore(prospect, estate) * 100
    const scoreTPer = (await MatchService.calculateProspectScore(prospect, estate)) * 100
    const percent = (scoreTPer + scoreLPer) / 2
    return {
      landlord_score: scoreLPer.toFixed(2),
      prospect_score: scoreTPer.toFixed(2),
      percent: percent.toFixed(2)
    }
  }

  static calculateLandlordScore(prospect, estate, debug = false) {
    let scoreL = 0

    let landlordBudgetScore = 0
    let creditScorePoints = 0
    let rentArrearsScore = 0
    let ageInRangeScore = 0
    let householdSizeScore = 0
    let petsScore = 0

    const landlordBudgetWeight = 1
    const creditScoreWeight = 1
    const rentArrearsWeight = 1
    const ageInRangeWeight = 0.6
    const householdSizeWeight = 0.3
    const petsWeight = 0.1

    const maxScoreL =
      landlordBudgetWeight +
      creditScoreWeight +
      rentArrearsWeight +
      ageInRangeWeight +
      householdSizeWeight +
      petsWeight

    //WBS certificate score
    if (!MatchService.calculateWBSScore(prospect.wbs_certificate, estate.wbs_certificate)) {
      if (debug) {
        return {
          scoreL: 0,
          reason: 'wbs certificate mismatch'
        }
      }
      return 0
    }
    const estateBudgetRel = estate.budget ? estate.net_rent / estate.budget : 0
    const estatePrice = Estate.getFinalPrice(estate)
    const userIncome = parseFloat(prospect.income) || 0
    if (!userIncome) {
      //added to prevent division by zero on calculation for realBudget
      if (debug) {
        return {
          scoreL: 0,
          reason: 'user income not set'
        }
      }
      return 0
    }
    const realBudget = estatePrice / userIncome
    let prospectHouseholdSize = parseInt(prospect.members_count) || 1 //adult count
    let estateFamilySizeMax = parseInt(estate.family_size_max) || 1
    let estateFamilySizeMin = parseInt(estate.family_size_min) || 1

    if (realBudget > 1) {
      //This means estatePrice is bigger than prospect's income. Prospect can't afford it
      if (debug) {
        return {
          scoreL: 0,
          reason: 'rent is bigger than income'
        }
      }
      return 0
    }

    //Landlord Budget Points...
    const LANDLORD_BUDGET_POINT_FACTOR = 0.1
    if (estateBudgetRel >= realBudget) {
      landlordBudgetScore = 1
    } else {
      landlordBudgetScore =
        ((-realBudget + estateBudgetRel + LANDLORD_BUDGET_POINT_FACTOR) /
          LANDLORD_BUDGET_POINT_FACTOR) *
        Number(
          (-realBudget + estateBudgetRel + LANDLORD_BUDGET_POINT_FACTOR) /
            LANDLORD_BUDGET_POINT_FACTOR >
            0
        )
    }
    log({ estateBudgetRel, realBudget, landlordBudgetScore })
    if (!landlordBudgetScore > 0) {
      if (debug) {
        return {
          scoreL,
          landlordBudgetScore,
          creditScorePoints,
          rentArrearsScore,
          ageInRangeScore,
          householdSizeScore,
          petsScore,
          reason: 'landlord budget score zero.'
        }
      }
      return 0
    }
    scoreL += landlordBudgetScore * landlordBudgetWeight

    // Credit Score Points
    const creditHistoryStatuses = prospect.credit_history_status
    let memberCount = 0
    creditHistoryStatuses.map(({ status }) => {
      creditScorePoints += +status === CREDIT_HISTORY_STATUS_NO_NEGATIVE_DATA ? 1 : 0
      memberCount++
    })
    creditScorePoints = creditScorePoints / memberCount
    log({ creditScorePoints })
    if (!creditScorePoints > 0) {
      if (debug) {
        return {
          scoreL,
          landlordBudgetScore,
          creditScorePoints,
          rentArrearsScore,
          ageInRangeScore,
          householdSizeScore,
          petsScore,
          reason: 'credit score zero.'
        }
      }
      return 0
    }
    scoreL += creditScorePoints * creditScoreWeight

    // Get rent arrears score
    if (estate.rent_arrears || !prospect.rent_arrears) {
      rentArrearsScore = 1
    }
    log({
      estateRentArrears: estate.rent_arrears,
      prospectUnpaidRental: prospect.rent_arrears
    })
    scoreL += rentArrearsWeight * rentArrearsScore

    // Age In Range Score
    const LESSER_THAN_MIN_AGE_FACTOR = 5.1
    const GREATER_THAN_MAX_AGE_FACTOR = 5.1
    if (estate.min_age && estate.max_age && prospect.members_age) {
      const isInRangeArray = (prospect.members_age || []).map((age) => {
        return inRange(age, estate.min_age, estate.max_age)
      })
      if (isInRangeArray.every((val, i, arr) => val === arr[0]) && isInRangeArray[0] === true) {
        //all ages are within the age range of the estate
        ageInRangeScore = 1
      } else {
        //some ages are outside range...
        if (max(prospect.members_age) > estate.max_age) {
          ageInRangeScore =
            (1 - (max(prospect.members_age) - estate.max_age) / GREATER_THAN_MAX_AGE_FACTOR) *
            Number((max(prospect.members_age) - estate.max_age) / GREATER_THAN_MAX_AGE_FACTOR > 0)
        } else if (min(prospect.members_age) < estate.min_age) {
          ageInRangeScore =
            (Number(
              (min(prospect.members_age) - estate.min_age + LESSER_THAN_MIN_AGE_FACTOR) /
                LESSER_THAN_MIN_AGE_FACTOR >=
                0
            ) *
              (min(prospect.members_age) - estate.min_age + LESSER_THAN_MIN_AGE_FACTOR)) /
            LESSER_THAN_MIN_AGE_FACTOR
        }
      }
    }
    if (!ageInRangeScore > 0) {
      if (debug) {
        return {
          scoreL,
          landlordBudgetScore,
          creditScorePoints,
          rentArrearsScore,
          ageInRangeScore,
          householdSizeScore,
          petsScore,
          reason: 'age in range zero.'
        }
      }
      return 0
    }
    scoreL += ageInRangeScore * ageInRangeWeight
    log({
      estateMinAge: estate.min_age,
      estateMaxAge: estate.max_age,
      prospectMembersAge: prospect.members_age,
      ageInRangeScore
    })

    // Household size
    const LESSER_THAN_HOUSEHOLD_SIZE_FACTOR = 1.1
    const GREATER_THAN_HOUSEHOLD_SIZE_FACTOR = 1.1
    if (
      prospectHouseholdSize >= estateFamilySizeMin &&
      prospectHouseholdSize <= estateFamilySizeMax
    ) {
      // Prospect Household Size is within the range of the estate's family size
      householdSizeScore = 1
    } else {
      if (prospectHouseholdSize > estateFamilySizeMax) {
        householdSizeScore =
          (1 - (prospectHouseholdSize - estateFamilySizeMax) / GREATER_THAN_HOUSEHOLD_SIZE_FACTOR) *
          Number(
            1 - (prospectHouseholdSize - estateFamilySizeMax) / GREATER_THAN_HOUSEHOLD_SIZE_FACTOR >
              0
          )
      } else if (prospectHouseholdSize < estateFamilySizeMin) {
        householdSizeScore =
          (((prospectHouseholdSize - estateFamilySizeMin + LESSER_THAN_HOUSEHOLD_SIZE_FACTOR) /
            LESSER_THAN_HOUSEHOLD_SIZE_FACTOR >=
            0) *
            (prospectHouseholdSize - estateFamilySizeMin + LESSER_THAN_HOUSEHOLD_SIZE_FACTOR)) /
          LESSER_THAN_HOUSEHOLD_SIZE_FACTOR
      }
    }
    log({ prospectHouseholdSize, estateFamilySizeMin, estateFamilySizeMax, householdSizeScore })
    if (!householdSizeScore > 0) {
      if (debug) {
        return {
          scoreL,
          landlordBudgetScore,
          creditScorePoints,
          rentArrearsScore,
          ageInRangeScore,
          householdSizeScore,
          petsScore,
          reason: 'household size score zero.'
        }
      }
      return 0
    }
    scoreL += householdSizeScore * householdSizeWeight

    // Pets
    if (prospect.pets === estate.pets_allowed) {
      petsScore = 1
    }
    log({ prospectPets: prospect.pets, estatePets: estate.pets_allowed })
    scoreL += petsWeight * petsScore

    const scoreLPer = scoreL / maxScoreL
    log({ scoreLandlordPercent: scoreLPer })

    if (debug) {
      return {
        scoreL,
        scoreLPer,
        landlordBudgetScore,
        creditScorePoints,
        rentArrearsScore,
        ageInRangeScore,
        householdSizeScore,
        petsScore
      }
    }
    return scoreLPer
  }

  static calculateWBSScore(prospectWbs, estateWbs) {
    if (estateWbs?.city) {
      if (!prospectWbs?.city || estateWbs.city !== prospectWbs.city) {
        return 0
      }
      const passedCertificate = estateWbs.income_level.filter(
        (level) => level === prospectWbs.income_level
      )
      return passedCertificate.length > 0 ? 1 : 0
    }
    return 1
  }

  static async calculateProspectScore(prospect, estate, debug = false) {
    let prospectBudgetScore = 0
    let roomsScore = 0
    let spaceScore = 0
    let floorScore = 0
    let rentStartScore = 0
    let aptTypeScore = 0
    let houseTypeScore = 0
    let amenitiesScore = 0

    // Prospect Score Weights
    const prospectBudgetWeight = 2
    const roomsWeight = 0.2
    const areaWeight = 0.4
    const rentStartWeight = 0.5
    const amenitiesWeight = 0.4
    const floorWeight = 0.3
    const aptTypeWeight = 0.1
    const houseTypeWeight = 0.1
    const maxScoreT =
      prospectBudgetWeight +
      rentStartWeight +
      amenitiesWeight +
      areaWeight +
      floorWeight +
      roomsWeight +
      aptTypeWeight +
      houseTypeWeight

    let scoreT = 0

    const prospectBudget = prospect.budget_max_scale || 0
    const estatePrice = Estate.getFinalPrice(estate)
    const userIncome = parseFloat(prospect.income) || 0
    const realBudget = estatePrice / userIncome

    const prospectBudgetRel = prospectBudget / 100

    //Prospect Budget Points
    const PROSPECT_BUDGET_POINT_FACTOR = 0.1
    if (realBudget > 1) {
      prospectBudgetScore = 0
    } else if (prospectBudgetRel >= realBudget) {
      prospectBudgetScore = 1
    } else {
      prospectBudgetScore =
        ((-realBudget + prospectBudgetRel + PROSPECT_BUDGET_POINT_FACTOR) /
          PROSPECT_BUDGET_POINT_FACTOR) *
        Number(
          (-realBudget + prospectBudgetRel + PROSPECT_BUDGET_POINT_FACTOR) /
            PROSPECT_BUDGET_POINT_FACTOR >
            0
        )
    }
    log({ userIncome, prospectBudgetScore, realBudget, prospectBudget: prospectBudget / 100 })
    if (!prospectBudgetScore > 0) {
      if (debug) {
        return {
          scoreT,
          prospectBudgetScore,
          roomsScore,
          spaceScore,
          floorScore,
          rentStartScore,
          aptTypeScore,
          houseTypeScore,
          amenitiesScore,
          reason: 'prospect budget score zero'
        }
      }
      return 0
    }
    scoreT = prospectBudgetScore * prospectBudgetWeight

    // Rooms Score
    const LESSER_THAN_ROOMS_SCORE_FACTOR = 1.5
    const GREATER_THAN_ROOMS_SCORE_FACTOR = 2.5
    const estateRooms = Number(estate.rooms_number) || 1
    const prospectRoomsMin = Number(prospect.rooms_min) || 0
    const prospectRoomsMax = Number(prospect.rooms_max) || 1
    if (estateRooms >= prospectRoomsMin && estateRooms <= prospectRoomsMax) {
      roomsScore = 1
    } else {
      if (estateRooms > prospectRoomsMax) {
        roomsScore =
          (1 - (estateRooms - prospectRoomsMax) / GREATER_THAN_ROOMS_SCORE_FACTOR) *
          Number(1 - (estateRooms - prospectRoomsMax) / GREATER_THAN_ROOMS_SCORE_FACTOR >= 0)
      } else if (estateRooms < prospectRoomsMin) {
        roomsScore =
          (Number(
            (estateRooms - prospectRoomsMin + LESSER_THAN_ROOMS_SCORE_FACTOR) /
              LESSER_THAN_ROOMS_SCORE_FACTOR >=
              0
          ) *
            (estateRooms - prospectRoomsMin + LESSER_THAN_ROOMS_SCORE_FACTOR)) /
          LESSER_THAN_ROOMS_SCORE_FACTOR
      }
    }
    log({
      roomsNumber: estateRooms,
      roomsMin: prospectRoomsMin,
      roomsMax: prospectRoomsMax,
      roomsScore
    })
    if (roomsScore <= 0) {
      if (debug) {
        return {
          scoreT,
          prospectBudgetScore,
          roomsScore,
          spaceScore,
          floorScore,
          rentStartScore,
          aptTypeScore,
          houseTypeScore,
          amenitiesScore,
          reason: 'rooms score zero'
        }
      }
      return 0
    }
    scoreT += roomsScore * roomsWeight

    //Space Score
    const estateArea = Number(estate.area) || 0
    const LESSER_THAN_SPACE_SCORE_FACTOR = 5.1
    const GREATER_THAN_SPACE_SCORE_FACTOR = 10.1
    const prospectSpaceMin = Number(prospect.space_min) || 0
    const prospectSpaceMax = Number(prospect.space_max) || 1
    if (estateArea >= prospectSpaceMin && estateArea <= prospectSpaceMax) {
      spaceScore = 1
    } else {
      if (estateArea > prospectSpaceMax) {
        spaceScore =
          (1 - (estateArea - prospectSpaceMax) / GREATER_THAN_SPACE_SCORE_FACTOR) *
          Number(1 - (estateArea - prospectSpaceMax) / GREATER_THAN_SPACE_SCORE_FACTOR >= 0)
      } else if (estateArea < prospect.space_min) {
        spaceScore =
          (Number(
            (estateArea - prospectSpaceMin + LESSER_THAN_SPACE_SCORE_FACTOR) /
              LESSER_THAN_SPACE_SCORE_FACTOR >=
              0
          ) *
            (estateArea - prospectSpaceMin + LESSER_THAN_SPACE_SCORE_FACTOR)) /
          LESSER_THAN_SPACE_SCORE_FACTOR
      }
    }
    log({
      estateArea,
      prospectSpaceMin,
      prospectSpaceMax,
      spaceScore
    })
    if (spaceScore <= 0) {
      if (debug) {
        return {
          scoreT,
          prospectBudgetScore,
          roomsScore,
          spaceScore,
          floorScore,
          rentStartScore,
          aptTypeScore,
          houseTypeScore,
          amenitiesScore,
          reason: 'space score zero'
        }
      }
      return 0
    }
    scoreT += spaceScore * areaWeight

    // Apt floor in range
    const estateFloors = parseInt(estate.number_floors) || 0
    const prospectFloorMin = parseInt(prospect.floor_min) || 0
    const prospectFloorMax = parseInt(prospect.floor_max) || 0
    const LESSER_THAN_FLOOR_SCORE_FACTOR = 1.1
    const GREATER_THAN_FLOOR_SCORE_FACTOR = 1.1
    if (estateFloors >= prospectFloorMin && estateFloors <= prospectFloorMax) {
      floorScore = 1
    } else {
      if (estateFloors > prospectFloorMax) {
        floorScore =
          (1 - (estateFloors - prospectFloorMax) / GREATER_THAN_FLOOR_SCORE_FACTOR) *
          Number(1 - (estateFloors - prospectFloorMax) / GREATER_THAN_FLOOR_SCORE_FACTOR >= 0)
      } else if (estateFloors < prospectFloorMin) {
        floorScore =
          (Number(
            (estateFloors - prospectFloorMin + LESSER_THAN_FLOOR_SCORE_FACTOR) /
              LESSER_THAN_FLOOR_SCORE_FACTOR >=
              0
          ) *
            (estateFloors - prospectFloorMin + LESSER_THAN_FLOOR_SCORE_FACTOR)) /
          LESSER_THAN_FLOOR_SCORE_FACTOR
      }
    }
    log({
      floor: estate.number_floors,
      floorMin: prospect.floor_min,
      floorMax: prospect.floor_max,
      floorScore
    })
    scoreT += floorScore * floorWeight

    //Rent Start Score prospect.rent_start is removed from the calculation
    const vacantFrom = parseInt(moment.utc(estate.vacant_date).startOf('day').format('X'))
    const now = parseInt(moment.utc().startOf('day').format('X'))
    const nextSixMonths = parseInt(moment.utc().add(6, 'M').format('X'))
    const nextYear = parseInt(moment.utc().add(1, 'y').format('X'))

    // we check outlyers first... now and nextYear
    if (vacantFrom < now || vacantFrom >= nextYear) {
      rentStartScore = 0
    } else if (vacantFrom <= nextSixMonths) {
      rentStartScore = 1
    } else if (vacantFrom > nextSixMonths) {
      rentStartScore =
        1 - vacantFrom / (nextYear - nextSixMonths) + nextSixMonths / (nextYear - nextSixMonths)
      if (rentStartScore < 0) rentStartScore = 0
    }
    log({ vacantFrom, now, nextSixMonths, nextYear, rentStartScore })
    if (rentStartScore <= 0) {
      if (debug) {
        return {
          scoreT,
          prospectBudgetScore,
          roomsScore,
          spaceScore,
          floorScore,
          rentStartScore,
          aptTypeScore,
          houseTypeScore,
          amenitiesScore,
          reason: 'rent start score zero'
        }
      }
      return 0
    }
    scoreT += rentStartScore * rentStartWeight

    // Apartment type is equal
    if ((prospect.apt_type || []).includes(estate.apt_type)) {
      aptTypeScore = 1
    }
    log({ prospectAptType: prospect.apt_type, estateAptType: estate.apt_type })
    scoreT += aptTypeScore * aptTypeWeight

    // House type is equal
    if ((prospect.house_type || []).includes(estate.house_type)) {
      houseTypeScore = 1
    }
    log({ prospectHouseType: prospect.house_type, estateHouseType: estate.house_type })
    scoreT += houseTypeScore * houseTypeWeight

    //Amenities Score
    const prospectPreferredAmenities = prospect.options || []
    const estateAmenities = estate.options || []
    const mandatoryAmenityIds = await EstateAmenityService.getMandatoryAmenityIds()
    if (prospectPreferredAmenities.length === 0) {
      amenitiesScore = 1
    } else {
      for (let count = 0; count < prospectPreferredAmenities.length; count++) {
        if (
          mandatoryAmenityIds.indexOf(prospectPreferredAmenities[count]) > -1 &&
          estateAmenities.indexOf(prospectPreferredAmenities[count]) === -1
        ) {
          //prospect has a mandatory amenity but estate doesn't have that amenity
          if (debug) {
            return {
              scoreT: 0,
              prospectBudgetScore,
              roomsScore,
              spaceScore,
              floorScore,
              rentStartScore,
              aptTypeScore,
              houseTypeScore,
              amenitiesScore,
              reason: 'prospect preferred mandatory amenities but not provided by estate'
            }
          }
          return 0
        }
      }
      const amenitiesProvidedByEstate = prospectPreferredAmenities.reduce(
        (amenitiesProvidedByEstate, prospectPreferredAmenity) => {
          if (estateAmenities.indexOf(prospectPreferredAmenity) > -1) {
            amenitiesProvidedByEstate = [...amenitiesProvidedByEstate, prospectPreferredAmenity]
          }
          return amenitiesProvidedByEstate
        },
        []
      )
      amenitiesScore = amenitiesProvidedByEstate.length / prospect.options.length
    }
    log({ estateAmenities: estate.options, prospectAmenities: prospect.options })
    scoreT += amenitiesScore * amenitiesWeight

    const scoreTPer = scoreT / maxScoreT
    log({ scoreProspectPercent: scoreTPer })

    if (debug) {
      return {
        scoreT,
        scoreTPer,
        prospectBudgetScore,
        roomsScore,
        spaceScore,
        floorScore,
        rentStartScore,
        aptTypeScore,
        houseTypeScore,
        amenitiesScore
      }
    }
    return scoreTPer
  }

  /**
   *
   */
  static async matchByUser({
    userId,
    ignoreNullFields = false,
    only_count = false,
    has_notification_sent = true
  }) {
    let totalCount = 0
    let totalCategoryCounts = {}
    let success = true
    let message = ''
    try {
      Logger.info(`matchByUser start ${userId} ${moment.utc(new Date()).toISOString()}`)
      const tenant = await MatchService.getProspectForScoringQuery()
        .select('_p.data as polygon')
        .innerJoin({ _p: 'points' }, '_p.id', 'tenants.point_id')
        .where({ 'tenants.user_id': userId })
        .first()
      Logger.info(`matchByUser get tenant ${userId} ${moment.utc(new Date()).toISOString()}`)
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
      const trx = await Database.beginTransaction()
      try {
        Logger.info(
          `matchByUser before getting inner matches ${userId} ${moment
            .utc(new Date())
            .toISOString()}`
        )
        const insideMatchResult = await this.createNewMatches(
          { tenant, has_notification_sent, only_count },
          trx
        )
        totalCount += insideMatchResult?.count ?? 0

        Logger.info(
          `matchByUser after getting inner matches ${userId} ${moment
            .utc(new Date())
            .toISOString()}`
        )
        const outsideMatchesResult = await ThirdPartyMatchService.createNewMatches(
          {
            tenant,
            has_notification_sent,
            only_count
          },
          trx
        )

        totalCount += outsideMatchesResult?.count ?? 0
        Logger.info(
          `matchByUser after getting outside matches ${userId} ${moment
            .utc(new Date())
            .toISOString()}`
        )

        if (only_count) {
          totalCategoryCounts = EstateService.sumCategoryCounts({
            insideMatchCounts: insideMatchResult?.categoryCounts || {},
            outsideMatchCounts: outsideMatchesResult?.categoryCounts || {}
          })
        }
        await trx.commit()

        let matches = []
        if (!only_count) {
          matches = await EstateService.getTenantEstates({
            user_id: userId,
            page: 1,
            limit: 20
          })
          Logger.info(
            `matchByUser after fetching matches ${userId} ${moment.utc(new Date()).toISOString()}`
          )
          totalCount = matches?.count || 0
          // WebSocket.publishToTenant({
          //   event: WEBSOCKET_EVENT_MATCH_CREATED,
          //   userId,
          //   data: {
          //     count: totalCount,
          //     matches,
          //     success,
          //     message,
          //   },
          // })
        }
        Logger.info(`matchByUser finish success${userId} ${moment.utc(new Date()).toISOString()}`)

        return {
          success: true,
          count: totalCount,
          matches,
          categories_count: totalCategoryCounts
        }
      } catch (e) {
        console.log('matchByUser error', e.message)
        await trx.rollback()
        success = false
        message = e.message
      }
    } catch (e) {
      Logger.info(
        `matchByUser exception ${userId} ${e.message} ${moment.utc(new Date()).toISOString()}`
      )
      success = false
      message = e.message

      // if (!only_count) {
      //   WebSocket.publishToTenant({
      //     event: WEBSOCKET_EVENT_MATCH_CREATED,
      //     userId,
      //     data: {
      //       count: 0,
      //       matches: [],
      //       success: false,
      //       message: e?.message,
      //     },
      //   })
      // }
      Logger.info(`matchByUser finish failure${userId} ${moment.utc(new Date()).toISOString()}`)
      return {
        count: totalCount,
        categories_count: totalCategoryCounts,
        success: false,
        matches: [],
        message: e?.message
      }
    }
  }

  static async createNewMatches({ tenant, only_count = false, has_notification_sent = true }, trx) {
    //FIXME: dist is not used in EstateService.searchEstatesQuery
    tenant.incomes = await require('./MemberService').getIncomes(tenant.user_id)
    let { estates, categoryCounts, groupedEstates } = await EstateService.searchEstatesQuery(tenant)
    if (only_count) {
      return {
        categoryCounts,
        count: groupedEstates?.length
      }
    }

    const estateIds = estates.reduce((estateIds, estate) => {
      return [...estateIds, estate.id]
    }, [])

    estates =
      (
        await MatchService.getEstateForScoringQuery().whereIn('estates.id', estateIds).fetch()
      ).toJSON() || []

    let passedEstates = []
    let idx = 0

    while (idx < estates.length) {
      const { percent, landlord_score, prospect_score } = await MatchService.calculateMatchPercent(
        tenant,
        estates[idx]
      )
      passedEstates.push({
        estate_id: estates[idx].id,
        percent,
        landlord_score,
        prospect_score,
        build_id: estates[idx].build_id
      })
      idx++
    }

    let matches =
      passedEstates.map((e) => ({
        user_id: tenant.user_id,
        estate_id: e.estate_id,
        percent: e.percent,
        prospect_score: e.prospect_score,
        landlord_score: e.landlord_score,
        status_at: moment.utc(new Date()).format(DATE_FORMAT),
        status: MATCH_STATUS_NEW
      })) || []

    // Create new matches
    // Delete old matches without any activity
    const oldMatches = (
      await Match.query()
        .where({ user_id: tenant.user_id, status: MATCH_STATUS_NEW })
        .whereNot({ buddy: true })
        .fetch()
    ).toJSON()

    const deleteMatchesIds = oldMatches
      .filter((om) => !matches.find((m) => m.estate_id === om.estate_id))
      .map((m) => m.id)

    if (deleteMatchesIds?.length) {
      await Match.query().whereIn('id', deleteMatchesIds).delete().transacting(trx)
    }

    if (isEmpty(matches)) {
      return {
        count: 0,
        matches: []
      }
    }

    await this.upsertBulkMatches(matches, trx)

    const groupedPassEstates = groupBy(passedEstates, (estate) =>
      estate.build_id ? `g_${estate.build_id}` : estate.id
    )
    const uniqueMatchEstateIds = Object.keys(groupedPassEstates).map(
      (key) => groupedPassEstates[key][0].id
    )

    matches = matches.filter((m) => uniqueMatchEstateIds.includes(m.estate_id))

    if (has_notification_sent) {
      const superMatches = matches.filter(
        ({ prospect_score }) => prospect_score >= MATCH_SCORE_GOOD_MATCH
      )
      if (superMatches?.length) {
        await NoticeService.prospectSuperMatch(superMatches)
      }
    }

    return {
      count: matches?.length,
      matches
    }
  }

  static async upsertBulkMatches(matches, trx = null) {
    let queries = `INSERT INTO matches 
                  ( user_id, estate_id, percent, status, landlord_score, prospect_score, status_at )    
                  VALUES 
                `
    queries = (matches || []).reduce(
      (q, current, index) =>
        `${q}\n ${index ? ',' : ''}
        ( ${current.user_id}, ${current.estate_id}, ${current.percent}, ${current.status},
          ${current.landlord_score}, ${current.prospect_score}, '${current.status_at}' ) `,
      queries
    )

    queries += ` ON CONFLICT ( user_id, estate_id ) 
                  DO UPDATE SET percent = EXCLUDED.percent, landlord_score = EXCLUDED.landlord_score,
                  prospect_score = EXCLUDED.prospect_score, status = EXCLUDED.status, status_at = EXCLUDED.status_at
                `
    if (trx) {
      await Database.raw(queries).transacting(trx)
    } else {
      await Database.raw(queries)
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

    const tenantUserIds = tenants.reduce(
      (tenantUserIds, tenant) => [...tenantUserIds, tenant.user_id],
      []
    )
    tenants =
      (
        await MatchService.getProspectForScoringQuery()
          .whereIn('tenants.user_id', tenantUserIds)
          .fetch()
      ).toJSON() || []

    // Calculate matches for tenants to current estate
    let passedEstates = []
    let idx = 0
    while (idx < tenants.length) {
      const { percent, landlord_score, prospect_score } = await MatchService.calculateMatchPercent(
        tenants[idx],
        estate
      )
      passedEstates.push({ user_id: tenants[idx].user_id, percent, prospect_score, landlord_score })
      idx++
    }
    const matches = passedEstates.map((i) => ({
      user_id: i.user_id,
      estate_id: estate.id,
      percent: i.percent,
      prospect_score: i.prospect_score,
      landlord_score: i.landlord_score
    }))

    // Delete old matches without any activity
    await Database.query()
      .from('matches')
      .where({ estate_id: estate.id, status: MATCH_STATUS_NEW })
      .delete()

    // Create new matches
    if (!isEmpty(matches)) {
      const insertQuery = Database.query().into('matches').insert(matches).toString()
      await Database.raw(
        `${insertQuery} ON CONFLICT (user_id, estate_id) DO UPDATE SET "percent" = EXCLUDED.percent`
      )
      const superMatches = matches.filter(({ percent }) => percent >= MATCH_SCORE_GOOD_MATCH)
      if (superMatches?.length) {
        //await NoticeService.prospectSuperMatch(superMatches, estateId)
        await NoticeService.prospectNewGreenMatch(superMatches, estate)
      }
    }
  }

  /**
   * Try to knock to estate
   */
  static async knockEstate(
    { estate_id, user_id, share_profile, knock_anyway, buddy = false, top = false },
    trx
  ) {
    let estate = await EstateService.getActiveById(estate_id)
    if (!estate) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }
    if (!estate.is_not_show && estate.status !== STATUS_OFFLINE_ACTIVE && share_profile) {
      throw new HttpException(UNSECURE_PROFILE_SHARE, 400, WARNING_UNSECURE_PROFILE_SHARE)
    }

    const query = Tenant.query().where({ user_id })
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
        .where({ user_id, estate_id, status: MATCH_STATUS_NEW })
        .first()
    }

    // Get like and check is match not exists or new
    const getLikes = () => {
      return Database.query()
        .from('likes')
        .select('matches.status')
        .where({ 'likes.user_id': user_id, 'likes.estate_id': estate_id })
        .leftJoin('matches', function () {
          this.on('matches.estate_id', 'likes.estate_id').on('matches.user_id', 'likes.user_id')
        })
        .first()
    }

    const { like, match } = await props({
      match: getMatches(),
      like: getLikes()
    })

    if (!match && !like && !knock_anyway && !share_profile) {
      throw new AppException('Not allowed', 400)
    }

    const scoringData = await MatchService.calculationMatchScoreByUserId({
      userId: user_id,
      estateId: estate_id
    })

    estate = scoringData.estate
    const { percent, landlord_score, prospect_score } = scoringData

    let isOutsideTrxExist = true
    if (!trx) {
      trx = await Database.beginTransaction()
      isOutsideTrxExist = false
    }

    let matches = []
    let estate_ids = []
    try {
      const sameCategoryEstates = await EstateService.getEstatesInSameCategory({
        estate,
        status: [STATUS_ACTIVE, STATUS_EXPIRE, STATUS_DRAFT]
      })

      estate_ids = sameCategoryEstates.map((e) => e.id)
      matches = sameCategoryEstates.map((e) => ({
        user_id,
        estate_id: e.id,
        percent,
        landlord_score,
        prospect_score,
        status: top ? MATCH_STATUS_TOP : MATCH_STATUS_KNOCK,
        share: share_profile ? true : false,
        buddy,
        knocked_at: moment.utc(new Date()).format(DATE_FORMAT),
        status_at: moment.utc(new Date()).format(DATE_FORMAT)
      }))

      if (!matches?.length) {
        throw new HttpException(NO_MATCH_EXIST, 400)
      }
      await this.upsertBulkMatches(matches, trx)

      await Dislike.query()
        .where('user_id', user_id)
        .whereIn('estate_id', estate_ids)
        .delete()
        .transacting(trx)

      if (!isOutsideTrxExist) {
        await trx.commit()
        this.sendMatchKnockWebsocket({
          estate_id,
          user_id,
          share_profile
        })
      }
    } catch (e) {
      if (!isOutsideTrxExist) {
        await trx.rollback()
      }

      throw new HttpException(e.message, 400)
    }
    return matches
  }

  static async calculationMatchScoreByUserId({ userId, estateId }) {
    const tenant = await MatchService.getProspectForScoringQuery()
      .select('_p.data as polygon')
      .innerJoin({ _p: 'points' }, '_p.id', 'tenants.point_id')
      .where({ 'tenants.user_id': userId })
      .first()

    if (!tenant) {
      throw new HttpException(USER_NOT_EXIST, 400)
    }

    tenant.incomes = await require('./MemberService').getIncomes(tenant.user_id)
    const estate =
      (
        await MatchService.getEstateForScoringQuery().where('estates.id', estateId).first()
      ).toJSON() || []

    if (!estate) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }

    const { percent, landlord_score, prospect_score } = await MatchService.calculateMatchPercent(
      tenant,
      estate
    )

    return {
      estate,
      percent,
      landlord_score,
      prospect_score
    }
  }

  static async sendMatchKnockWebsocket({ estate_id, user_id, share_profile = false }) {
    this.emitMatch({
      data: {
        estate_id: estate_id,
        user_id: user_id,
        old_status: MATCH_STATUS_NEW,
        share: share_profile,
        status_at: moment.utc(new Date()).format(DATE_FORMAT),
        status: MATCH_STATUS_KNOCK
      },
      role: ROLE_LANDLORD,
      event: WEBSOCKET_EVENT_MATCH_STAGE
    })

    this.emitMatch({
      data: {
        estate_id: estate_id,
        user_id: user_id,
        old_status: MATCH_STATUS_NEW,
        share: share_profile,
        status_at: moment.utc(new Date()).format(DATE_FORMAT),
        status: MATCH_STATUS_KNOCK
      },
      role: ROLE_LANDLORD
    })
  }

  static async sendMatchInviteWebsocketFromKnock({ estate_id, user_id, share_profile = false }) {
    const estate = await EstateService.getActiveById(estate_id)
    if (!estate) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }
    this.emitMatch({
      data: {
        estate_id,
        user_id,
        old_status: MATCH_STATUS_NEW,
        share: share_profile,
        status_at: moment.utc(new Date()).format(DATE_FORMAT),
        status: estate.is_not_show ? MATCH_STATUS_TOP : MATCH_STATUS_INVITE
      },
      role: ROLE_LANDLORD,
      event: WEBSOCKET_EVENT_MATCH_STAGE
    })

    this.emitMatch({
      data: {
        estate_id,
        user_id,
        old_status: MATCH_STATUS_NEW,
        share: share_profile,
        status_at: moment.utc(new Date()).format(DATE_FORMAT),
        status: estate.is_not_show ? MATCH_STATUS_TOP : MATCH_STATUS_INVITE
      },
      role: ROLE_LANDLORD
    })
  }

  static emitCreateMatchCompleted({ user_id, data }) {
    WebSocket.publishToTenant({ event: WEBSOCKET_EVENT_MATCH_CREATED, userId: user_id, data })
  }

  static async emitMatch({ data, role, event = WEBSOCKET_EVENT_MATCH }) {
    if (!data.estate_id) {
      return
    }

    let estate
    let landlordSenderId = null

    if (event === WEBSOCKET_EVENT_MATCH) {
      const estates = await require('./EstateService').getEstatesByUserId({
        limit: 1,
        from: 0,
        params: { id: data?.estate_id }
      })
      estate = estates.data?.[0]
      landlordSenderId = estate?.user_id
    } else {
      const estateInfo = await require('./EstateService')
        .getActiveEstateQuery()
        .select('id', 'user_id')
        .where('estates.id', data.estate_id)
        .first()
      landlordSenderId = estateInfo?.user_id
      if (!data?.from_market_place && data.user_id) {
        const estates = await this.getLandlordMatchesWithFilterQuery(
          estateInfo,
          {},
          { user_id: data.user_id, matchStatus: data.status }
        ).paginate(1, 1)

        estate = estates.rows?.[0]
      }
    }

    if (estate?.build_id) {
      estate.building = await require('./BuildingService').get({
        id: estate.build_id,
        user_id: estate.user_id
      })
    }

    if (role === ROLE_LANDLORD) {
      data = {
        ...data,
        status_at: moment.utc(new Date()).format(DATE_FORMAT),
        estate: data?.estate || estate
      }
    }

    if (role === ROLE_LANDLORD) {
      WebSocket.publishToLandlord({ event, userId: landlordSenderId, data })
    } else {
      WebSocket.publishToTenant({ event, userId: data.user_id, data })
    }
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
      await EstateService.addDislike({ user_id: userId, estate_id: estateId }, trx)
      await trx.commit()
      this.emitMatch({
        data: {
          estate_id: estateId,
          user_id: userId,
          old_status: MATCH_STATUS_KNOCK,
          status: NO_MATCH_STATUS
        },
        role: ROLE_LANDLORD,
        event: WEBSOCKET_EVENT_MATCH_STAGE
      })

      this.emitMatch({
        data: {
          estate_id: estateId,
          user_id: userId,
          old_status: MATCH_STATUS_KNOCK,
          status: NO_MATCH_STATUS
        },
        role: ROLE_LANDLORD
      })
      return true
    } catch (e) {
      await trx.rollback()
      throw e
    }
  }

  static async matchMoveToNewEstate({ estateId, userId, newEstateId, landlordId }) {
    const estate = await EstateService.getMatchEstate(estateId, landlordId)
    const newEstate = await EstateService.getMatchEstate(newEstateId, landlordId)

    const match = await Database.query()
      .table('matches')
      .where({ estate_id: estateId, user_id: userId })
      .where(function () {
        this.orWhere('status', '<=', MATCH_STATUS_COMMIT)
        this.orWhere(function () {
          this.where('status', MATCH_STATUS_NEW)
          this.where('buddy', true)
        })
      })
      .first()

    if (!match) {
      throw new AppException(ERROR_COMMIT_MATCH_INVITE, 400, ERROR_COMMIT_MATCH_INVITE_CODE)
    }

    const newMatch = await Match.query().where({ estate_id: newEstateId, user_id: userId }).first()
    if (newMatch?.status >= match.status) {
      throw new AppException(ERROR_ALREADY_MATCH_INVITE, 400, ERROR_ALREADY_MATCH_INVITE_CODE)
    }

    const { percent, prospect_score, landlord_score } = await this.calculationMatchScoreByUserId({
      userId,
      estateId: newEstateId
    })

    const trx = await Database.beginTransaction()
    try {
      let newStatus = match.status
      if (match.status === MATCH_STATUS_NEW && match.buddy) {
        match.status = MATCH_STATUS_KNOCK
      }

      let isMovedToNewEstate = true
      const newMatch = {
        ...match,
        estate_id: newEstateId,
        percent,
        landlord_score,
        prospect_score,
        status_at: moment.utc(new Date()).format(DATE_FORMAT)
      }

      switch (match.status) {
        case MATCH_STATUS_KNOCK:
        case MATCH_STATUS_INVITE:
          await this.matchInviteAfter({ userId, estate: newEstate }, trx)
          if (newEstate.is_not_show) {
            newStatus = MATCH_STATUS_TOP
          } else {
            newStatus = MATCH_STATUS_INVITE
          }

          break
        case MATCH_STATUS_VISIT:
        case MATCH_STATUS_SHARE:
          await this.upsertBulkMatches([newMatch], trx)
          break
        case MATCH_STATUS_TOP:
          await this.toTop(
            {
              estateId: newEstateId,
              tenantId: userId,
              landlordId: estate.user_id,
              match: newMatch
            },
            trx
          )
          break
        case MATCH_STATUS_COMMIT:
          if (!(await MatchService.canRequestFinalCommit(newEstateId))) {
            throw new HttpException(ERROR_MATCH_COMMIT_DOUBLE, 400, ERROR_MATCH_COMMIT_DOUBLE_CODE)
          }

          await MatchService.requestFinalConfirm(
            {
              estateId: newEstateId,
              tenantId: userId,
              match: newMatch
            },
            trx
          )
          console.log('matchMoveToNewEstate=', MATCH_STATUS_COMMIT)
          break
        default:
          isMovedToNewEstate = false
          break
      }

      //remove original estate
      if (isMovedToNewEstate) {
        await Match.query()
          .where('user_id', userId)
          .where('estate_id', estateId)
          .delete()
          .transacting(trx)
      }

      this.emitMatch({
        data: {
          estate_id: newEstateId,
          user_id: userId,
          old_status: newMatch?.status || NO_MATCH_STATUS,
          status: newStatus
        },
        role: ROLE_USER
      })
      await trx.commit()

      if (isMovedToNewEstate) {
        this.emitMatch({
          data: {
            estate_id: estateId,
            user_id: userId,
            old_status: match.status,
            status: NO_MATCH_STATUS
          },
          role: ROLE_USER
        })
      }
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400, e.code || 0)
    }
  }

  /**
   * Invite knocked user
   */
  static async inviteKnockedUser({ estate, userId, is_from_market_place = false }, trx = null) {
    const estateId = estate.id
    console.log(`inviteKnockedUser ${estateId} ${userId}`)
    //invited from knock
    if (!is_from_market_place) {
      const match = await Database.query()
        .table('matches')
        .where({ estate_id: estateId, user_id: userId })
        .where(function () {
          this.orWhere('status', MATCH_STATUS_KNOCK)
          this.orWhere(function () {
            this.where('status', MATCH_STATUS_NEW)
            this.where('buddy', true)
          })
        })
        .first()

      if (!match) {
        throw new AppException('Invalid match stage')
      }
    }
    await this.matchInviteAfter({ userId, estate }, trx)
    this.emitMatch({
      data: {
        estate_id: estateId,
        user_id: userId,
        old_status: MATCH_STATUS_KNOCK,
        status: estate.is_not_show ? MATCH_STATUS_TOP : MATCH_STATUS_INVITE
      },
      role: ROLE_USER
    })
    await this.removeAutoKnockedMatch({ id: estateId, user_id: userId }, trx)
  }

  static async matchInviteAfter({ userId, estate }, trx) {
    if (!estate.is_not_show) {
      const freeTimeSlots = await require('./TimeSlotService').getFreeTimeslots(estate.id)
      const timeSlotCount = Object.keys(freeTimeSlots || {}).length || 0
      if (!timeSlotCount) {
        throw new HttpException(TIME_SLOT_NOT_FOUND, 400, NO_TIME_SLOT_ERROR_CODE)
      }
    }

    const existingMatch = await Match.query()
      .where('estate_id', estate.id)
      .where('user_id', userId)
      .first()

    if (existingMatch) {
      let query = Database.table('matches')
        .update({
          status: estate.is_not_show ? MATCH_STATUS_TOP : MATCH_STATUS_INVITE,
          share: estate.is_not_show,
          status_at: moment.utc(new Date()).format(DATE_FORMAT)
        })
        .where({
          user_id: userId,
          estate_id: estate.id
        })
      if (trx) {
        query.transacting(trx)
      }
      await query
    } else {
      await Match.createItem(
        {
          user_id: userId,
          estate_id: estate.id,
          status: estate.is_not_show ? MATCH_STATUS_TOP : MATCH_STATUS_INVITE,
          percent: 0,
          status_at: moment.utc(new Date()).format(DATE_FORMAT)
        },
        trx
      )
    }

    if (estate.is_not_show) {
      await require('./TaskService').createGlobalTask(
        { tenantId: userId, landlordId: estate.user_id, estateId: estate.id },
        trx
      )
      await NoticeService.landlordMovedProspectToTop(estate.id, userId)
    } else {
      await NoticeService.userInvite(estate.id, userId)
      MatchService.inviteEmailToProspect({ estateId: estate.id, userId })
    }
  }

  static async removeAutoKnockedMatch({ id, user_id }, trx) {
    const estates = await EstateService.getEstatesInSameCategory({
      id,
      status: [STATUS_ACTIVE, STATUS_EXPIRE, STATUS_DRAFT]
    })
    const estate_ids = estates.map((e) => e.id).filter((eid) => eid !== id)
    if (estate_ids?.length) {
      const query = Match.query()
        .where('user_id', user_id)
        .whereIn('estate_id', estate_ids)
        .whereIn('status', [MATCH_STATUS_KNOCK, MATCH_STATUS_KNOCK])
        .delete()

      if (trx) {
        await query.transacting(trx)
      }

      await query
    }
  }

  static async sendKnockedReachedNotification() {
    try {
      const estates = (
        await Estate.query()
          .select(
            'estates.id',
            'estates.min_invite_count',
            'estates.address',
            'estates.cover',
            'estates.user_id',
            'estates.notify_on_green_matches',
            'estates.notify_sent'
          )
          .select('_m.percent')
          .where('estates.status', STATUS_ACTIVE)
          .innerJoin({ _m: 'matches' }, function () {
            this.on('_m.estate_id', 'estates.id')
          })
          .whereNotNull('estates.min_invite_count')
          .where('estates.min_invite_count', '>', 0)
          .where(function () {
            this.orWhereNull('estates.notify_sent')
            this.orWhere(function () {
              this.where('estates.notify_on_green_matches', true)
              this.whereNot(
                Database.raw(
                  `${NOTICE_TYPE_LANDLORD_GREEN_MIN_PROSPECTS_REACHED_ID} = any(estates.notify_sent)`
                )
              )
            })
            this.orWhere(function () {
              this.whereNot('estates.notify_on_green_matches', true)
              this.whereNot(
                Database.raw(
                  `${NOTICE_TYPE_LANDLORD_MIN_PROSPECTS_REACHED_ID} = any(estates.notify_sent)`
                )
              )
            })
          })
          .where(function () {
            this.orWhere('_m.status', MATCH_STATUS_KNOCK)
            this.orWhere(function () {
              this.where('_m.status', MATCH_STATUS_NEW)
              this.where('_m.buddy', true)
            })
          })
          .fetch()
      ).toJSON()

      const groupedEstates = groupBy(estates, (estate) => estate.id)
      await Promise.map(Object.keys(groupedEstates) || [], async (id) => {
        await MatchService.sendFullInvitationNotification(groupedEstates[id])
      })
    } catch (e) {
      console.log('sendKnockedReachedNotification error', e.message)
    }
  }

  static async sendFullInvitationNotification(matches) {
    if (!matches?.length) {
      return
    }
    let invitedCount = 0
    if (matches[0].notify_on_green_matches) {
      // if red match is accpeted
      const greenMatchCount = matches.filter(
        (match) => match.percent >= MATCH_SCORE_GOOD_MATCH
      )?.length
      invitedCount = greenMatchCount
      if (matches[0].min_invite_count && parseInt(matches[0].min_invite_count) <= greenMatchCount) {
        await require('./EstateService').updateSentNotification(
          matches[0],
          NOTICE_TYPE_LANDLORD_GREEN_MIN_PROSPECTS_REACHED_ID
        )
        NoticeService.sendGreenMinKnockReached({
          estate: matches[0],
          count: invitedCount
        })
      }
    } else {
      // if only green matches knocks accpeted
      invitedCount = matches.length
      if (matches[0].min_invite_count && parseInt(matches[0].min_invite_count) <= matches.length) {
        await require('./EstateService').updateSentNotification(
          matches[0],
          NOTICE_TYPE_LANDLORD_MIN_PROSPECTS_REACHED_ID
        )

        NoticeService.sendMinKnockReached({
          estate: matches[0],
          count: invitedCount
        })
      }
    }
  }

  static async inviteEmailToProspect({ estateId, userId }) {
    const estate = await EstateService.getById(estateId)
    const tenant = await UserService.getById(userId)

    const lang = tenant.lang ? tenant.lang : DEFAULT_LANG

    await MailService.inviteEmailToProspect({
      email: tenant.email,
      address: estate.address,
      lang: lang
    })
  }

  /**
   * Cancel invite if already invited
   */
  static async cancelInvite(estateId, userId, role) {
    const match = await Database.query()
      .table('matches')
      .where({ user_id: userId, status: MATCH_STATUS_INVITE, estate_id: estateId })
      .first()

    if (!match) {
      throw new AppException('Invalid match stage')
    }

    await Database.table('matches')
      .update({ status: MATCH_STATUS_KNOCK, status_at: moment.utc(new Date()).format(DATE_FORMAT) })
      .where({
        user_id: userId,
        estate_id: estateId
      })

    if (role === ROLE_USER) {
      this.emitMatch({
        data: {
          estate_id: estateId,
          user_id: userId,
          old_status: MATCH_STATUS_INVITE,
          status: MATCH_STATUS_KNOCK
        },
        role: ROLE_LANDLORD,
        event: WEBSOCKET_EVENT_MATCH_STAGE
      })
    }

    this.emitMatch({
      data: {
        estate_id: estateId,
        user_id: userId,
        old_status: MATCH_STATUS_INVITE,
        status: MATCH_STATUS_KNOCK
      },
      role: role === ROLE_LANDLORD ? ROLE_USER : ROLE_LANDLORD
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
      existingUserBook: getUserBookAnother()
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

    // const getAnotherVisit = async () =>
    //   Database.table('visits')
    //     .where({ estate_id: estateId })
    //     .where({ date: slotDate.format(DATE_FORMAT) })
    //     .first()

    const { currentTimeslot } = await props({
      currentTimeslot: getTimeslot()
      // anotherVisit: getAnotherVisit(),
    })

    // if (!currentTimeslot || (anotherVisit && currentTimeslot.slot_length)) {
    if (!currentTimeslot) {
      throw new AppException('Cant book this slot')
    }

    const endDate = currentTimeslot.slot_length
      ? moment(slotDate).add(parseInt(currentTimeslot.slot_length), 'minutes')
      : moment(slotDate).add(MINIMUM_SHOW_PERIOD, 'minutes')

    // if show end time is bigger than show time
    if (moment.utc(currentTimeslot.end_at, DATE_FORMAT) < endDate) {
      throw new AppException("can't book this time slot, out of time range!")
    }

    const trx = await Database.beginTransaction()
    try {
      // Book new visit to calendar
      await Database.into('visits')
        .insert({
          estate_id: estate.id,
          user_id: userId,
          date: slotDate.format(DATE_FORMAT),
          start_date: slotDate.format(DATE_FORMAT),
          end_date: currentTimeslot.slot_length
            ? endDate.format(DATE_FORMAT)
            : currentTimeslot.end_at
        })
        .transacting(trx)

      // Move match status to next
      await Match.query()
        .update({
          status: MATCH_STATUS_VISIT,
          status_at: moment.utc(new Date()).format(DATE_FORMAT)
        })
        .where({
          user_id: userId,
          estate_id: estateId
        })
        .transacting(trx)

      // Calc booked timeslots and send notification if all booked
      const { total, booked } = await MatchService.getEstateSlotsStat(estateId)
      if (booked === total) {
        await NoticeService.landlordTimeslotsBooked(estateId, total, booked)
      }

      this.emitMatch({
        data: {
          estate_id: estateId,
          user_id: userId,
          old_status: MATCH_STATUS_INVITE,
          status: MATCH_STATUS_VISIT
        },
        role: ROLE_LANDLORD,
        event: WEBSOCKET_EVENT_MATCH_STAGE
      })

      this.emitMatch({
        data: {
          estate_id: estateId,
          user_id: userId,
          old_status: MATCH_STATUS_INVITE,
          status: MATCH_STATUS_VISIT
        },
        role: ROLE_LANDLORD
      })

      await trx.commit()
    } catch (e) {
      await trx.rollback()
      Logger.error(`bookTimeSlot error ${userId} ${estateId} ${e.message || e}`)
      throw new HttpException(e.message, 400)
    }
  }

  static async updateVisitIn(estateId, userId, inviteIn = true) {
    await Database.table('matches').update({ inviteIn: inviteIn }).where({
      user_id: userId,
      estate_id: estateId
    })
  }

  static async deleteVisit(estate_id, userIds, trx) {
    if (!userIds) return
    userIds = !Array.isArray(userIds) ? [userIds] : userIds
    await Visit.query()
      .where('estate_id', estate_id)
      .whereIn('user_id', userIds)
      .delete()
      .transacting(trx)
  }

  static async matchToInvite(estate_id, userIds, trx) {
    if (!userIds) return
    userIds = !Array.isArray(userIds) ? [userIds] : userIds
    await Match.query()
      .update({
        status: MATCH_STATUS_INVITE,
        status_at: moment.utc(new Date()).format(DATE_FORMAT)
      })
      .where('estate_id', estate_id)
      .whereIn('user_id', userIds)
      .transacting(trx)
  }

  static async cancelVisit(estateId, userId, trx = null) {
    let isInsideTrx = false
    if (!trx) {
      trx = await Database.beginTransaction()
      isInsideTrx = true
    }
    const match = await Database.query()
      .table('matches')
      .where({ user_id: userId, status: MATCH_STATUS_VISIT, estate_id: estateId })
      .first()

    if (!match) {
      throw new AppException('Invalid match stage')
    }

    try {
      await this.deleteVisit(estateId, userId, trx)
      await this.matchToInvite(estateId, userId, trx)
      if (isInsideTrx) {
        await trx.commit()
      }

      this.emitMatch({
        data: {
          estate_id: estateId,
          user_id: userId,
          old_status: MATCH_STATUS_VISIT,
          status: MATCH_STATUS_INVITE
        },
        role: ROLE_LANDLORD
      })

      this.emitMatch({
        data: {
          estate_id: estateId,
          user_id: userId,
          old_status: MATCH_STATUS_VISIT,
          status: MATCH_STATUS_INVITE
        },
        role: ROLE_LANDLORD,
        event: WEBSOCKET_EVENT_MATCH_STAGE
      })

      NoticeService.cancelVisit(estateId, null, userId)
    } catch (e) {
      if (isInsideTrx) {
        await trx.rollback()
      }
      throw new HttpException('Failed to cancel visit', 500)
    }
  }

  static async handleMatchesOnTimeSlotUpdate(estateId, userIds, trx) {
    if (!userIds) return
    userIds = !Array.isArray(userIds) ? [userIds] : userIds

    const match = await Match.query()
      .table('matches')
      .whereIn('user_id', userIds)
      .whereIn('status', [MATCH_STATUS_VISIT])
      .where('estate_id', estateId)
      .fetch()

    if (!match) {
      throw new AppException('Invalid match stage')
    }

    try {
      await this.deleteVisit(estateId, userIds, trx)
      await this.matchToInvite(estateId, userIds, trx)

      userIds.map((userId) => {
        MatchService.emitMatch({
          data: {
            estate_id: estateId,
            user_id: userId,
            old_status: MATCH_STATUS_VISIT,
            status: MATCH_STATUS_INVITE
          },
          role: ROLE_USER
        })
      })
    } catch (e) {
      throw new HttpException('Failed to update time slot', e.status || 500)
    }
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

    const updateMatch = Database.table('matches')
      .update({
        status: MATCH_STATUS_INVITE,
        status_at: moment.utc(new Date()).format(DATE_FORMAT)
      })
      .where({
        user_id: tenantId,
        estate_id: estateId
      })

    await Promise.all([deleteVisit, updateMatch])

    this.emitMatch({
      data: {
        estate_id: estateId,
        user_id: tenantId,
        old_status: MATCH_STATUS_VISIT,
        status: MATCH_STATUS_INVITE
      },
      role: ROLE_USER
    })

    NoticeService.cancelVisit(estateId, tenantId)
  }

  static async inviteTenantInToVisit(estateId, tenantId) {
    NoticeService.inviteTenantInToVisit(estateId, tenantId)
  }

  /**
   * Share tenant personal data to landlord
   */
  static async share({ landlord_id, estate_id, code }) {
    const userTenant = await User.query()
      .where({
        code,
        role: ROLE_USER
      })
      .first()

    if (!userTenant) {
      throw new HttpException(WRONG_PROSPECT_CODE, 400, WRONG_PROSPECT_CODE_ERROR_CODE)
    }

    const match = await Database.table('matches')
      .where({
        estate_id,
        status: MATCH_STATUS_VISIT,
        user_id: userTenant.id
      })
      .first()
    if (!match) {
      throw new AppException('Invalid code or match status')
    }

    await Database.table('matches')
      .update({
        status: MATCH_STATUS_SHARE,
        status_at: moment.utc(new Date()).format(DATE_FORMAT),
        share: true
      })
      .where({
        user_id: userTenant.id,
        estate_id
      })

    this.emitMatch({
      data: {
        estate_id,
        user_id: userTenant.id,
        old_status: MATCH_STATUS_VISIT,
        status: MATCH_STATUS_SHARE
      },
      role: ROLE_USER
    })

    return { tenantId: userTenant.id, tenantUid: userTenant.uid }
  }

  static async cancelShare(estateId, user_id) {
    const match = await Database.table('matches')
      .where({
        estate_id: estateId,
        share: true,
        user_id
      })
      .first()
    if (!match) {
      throw new AppException('Invalid code or match status')
    }

    await Database.table('matches')
      .update({
        status: MATCH_STATUS_VISIT,
        share: false,
        status_at: moment.utc(new Date()).format(DATE_FORMAT)
      })
      .where({
        user_id,
        estate_id: estateId
      })

    /**Need to confirm status */

    this.emitMatch({
      data: {
        estate_id: estateId,
        user_id: user_id,
        old_status: match.status,
        status: MATCH_STATUS_VISIT,
        share: false
      },
      role: ROLE_LANDLORD
    })

    this.emitMatch({
      data: {
        estate_id: estateId,
        user_id: user_id,
        old_status: match.status,
        status: MATCH_STATUS_VISIT,
        share: false
      },
      role: ROLE_LANDLORD,
      event: WEBSOCKET_EVENT_MATCH_STAGE
    })

    NoticeService.prospectIsNotInterested(estateId)
  }

  static async matchCount(status = [MATCH_STATUS_KNOCK], estatesId) {
    return await Database.table('matches')
      .whereIn('status', status)
      .whereIn('estate_id', estatesId)
      .count('*')
  }

  static async buddyInvitationCount(estateId) {
    return await Database.table('matches')
      .whereIn('status', MATCH_STATUS_NEW)
      .where('buddy', true)
      .whereIn('estate_id', estatesId)
      .count('*')
  }

  static async canRequestFinalCommit(estateId) {
    const counts = await this.matchCount([MATCH_STATUS_COMMIT], [estateId])

    if (counts?.[0]?.count) {
      return true
    }

    return false
  }

  /**
   *
   */
  static async toTop({ estateId, tenantId, landlordId, match }, trx) {
    try {
      let topMatch
      if (!match) {
        topMatch = await Match.query()
          .update({
            status: MATCH_STATUS_TOP,
            status_at: moment.utc(new Date()).format(DATE_FORMAT)
          })
          .where('user_id', tenantId)
          .where('estate_id', estateId)
          .where('share', true)
          .whereIn('status', [MATCH_STATUS_SHARE, MATCH_STATUS_VISIT])
          .transacting(trx)
        if (!topMatch) {
          throw new HttpException('No record found', 400)
        }

        this.emitMatch({
          data: {
            estate_id: estateId,
            user_id: tenantId,
            old_status: MATCH_STATUS_SHARE,
            share: true,
            status: MATCH_STATUS_TOP
          },
          role: ROLE_USER
        })
      } else {
        topMatch = await this.upsertBulkMatches([match], trx)
      }
      await require('./TaskService').createGlobalTask({ tenantId, landlordId, estateId }, trx)

      return topMatch
    } catch (e) {
      throw new HttpException(e.message, e.status || 400, e.code || 0)
    }
  }

  static async cancelTopByTenant(estateId, tenantId) {
    const deleteMatch = Database.table('matches')
      .where({
        status: MATCH_STATUS_TOP,
        user_id: tenantId,
        estate_id: estateId
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
        await EstateService.addDislike({ user_id: tenantId, estate_id: estateId })
      }
    }

    this.emitMatch({
      data: {
        estate_id: estateId,
        user_id: tenantId,
        old_status: MATCH_STATUS_TOP,
        status: NO_MATCH_STATUS
      },
      role: ROLE_LANDLORD
    })

    this.emitMatch({
      data: {
        estate_id: estateId,
        user_id: tenantId,
        old_status: MATCH_STATUS_TOP,
        status: NO_MATCH_STATUS
      },
      role: ROLE_LANDLORD,
      event: WEBSOCKET_EVENT_MATCH_STAGE
    })

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
        estate_id: estateId
      })
      .first()

    if (!match) {
      throw new AppException('Invalid match status')
    }

    await Database.table('matches')
      .update({
        status: match.share ? MATCH_STATUS_SHARE : MATCH_STATUS_VISIT,
        status_at: moment.utc(new Date()).format(DATE_FORMAT)
      })
      .where({
        user_id: tenantId,
        estate_id: estateId
      })

    this.emitMatch({
      data: {
        estate_id: estateId,
        user_id: tenantId,
        old_status: MATCH_STATUS_TOP,
        status: match.share ? MATCH_STATUS_SHARE : MATCH_STATUS_VISIT
      },
      role: ROLE_USER
    })
  }

  /**
   *
   */

  static async getFinalMatch(estateId) {
    return await Database.table('matches')
      .where({
        estate_id: estateId,
        status: MATCH_STATUS_FINISH
      })
      .first()
  }

  static async checkMatchIsValidForFinalRequest(estateId, tenantId) {
    const match = Database.table('matches')
      .where({ status: MATCH_STATUS_TOP, share: true, user_id: tenantId, estate_id: estateId })
      .first()
    return match
  }

  static async requestFinalConfirm({ estateId, tenantId, match }, trx) {
    try {
      if (!match) {
        await Match.query()
          .where({
            user_id: tenantId,
            estate_id: estateId,
            status: MATCH_STATUS_TOP
          })
          .update({
            status: MATCH_STATUS_COMMIT,
            status_at: moment.utc(new Date()).format(DATE_FORMAT)
          })
          .transacting(trx)
        await NoticeService.prospectRequestConfirm(estateId, tenantId)
        this.emitMatch({
          data: {
            estate_id: estateId,
            user_id: tenantId,
            old_status: MATCH_STATUS_TOP,
            status: MATCH_STATUS_COMMIT
          },
          role: ROLE_USER
        })
      } else {
        await this.upsertBulkMatches([match], trx)
        await NoticeService.prospectRequestConfirm(match.estate_id, tenantId)
      }

      await require('./MemberService').setFinalIncome({ user_id: tenantId, is_final: true }, trx)
    } catch (e) {
      throw new HttpException(e.message, e.status || 400)
    }
  }

  static async tenantCancelCommit(estateId, userId) {
    const trx = await Database.beginTransaction()
    try {
      await Match.query()
        .where({
          user_id: userId,
          estate_id: estateId,
          status: MATCH_STATUS_COMMIT
        })
        .update({ status: MATCH_STATUS_TOP, status_at: moment.utc(new Date()).format(DATE_FORMAT) })
        .transacting(trx)

      await require('./MemberService').setFinalIncome({ user_id: userId, is_final: false }, trx)
      await trx.commit()

      this.emitMatch({
        data: {
          estate_id: estateId,
          user_id: userId,
          old_status: MATCH_STATUS_COMMIT,
          status: MATCH_STATUS_TOP
        },
        role: ROLE_LANDLORD
      })

      this.emitMatch({
        data: {
          estate_id: estateId,
          user_id: userId,
          old_status: MATCH_STATUS_COMMIT,
          status: MATCH_STATUS_TOP
        },
        role: ROLE_LANDLORD,
        event: WEBSOCKET_EVENT_MATCH_STAGE
      })

      this.emitMatch({
        data: {
          estate_id: estateId,
          user_id: userId,
          old_status: MATCH_STATUS_COMMIT,
          status: MATCH_STATUS_TOP
        },
        role: ROLE_USER
      })

      NoticeService.prospectIsNotInterested(estateId)
    } catch (e) {
      await trx.rollback()
      console.log('tenantCancelCommit', e.message)
      throw new HttpException(e.message, e.status || 400)
    }
  }

  static async moveExpiredFinalConfirmToTop() {
    const matches = (
      await Match.query()
        .where('status', MATCH_STATUS_COMMIT)
        .where(
          'status_at',
          '<=',
          moment
            .utc(new Date())
            .add(-1 * EXPIRED_FINAL_CONFIRM_PERIOD, 'days')
            .format()
        )
        .fetch()
    ).toJSON()
    Logger.info('moveExpiredFinalConfirmToTop=', matches)
    await Promise.map(
      matches || [],
      async (match) => {
        await MatchService.tenantCancelCommit(match.estate_id, match.user_id)
        const estate = await EstateService.getById(match.estate_id)
        await NoticeService.finalMatchConfirmExpired(estate)
      },
      { concurrency: 1 }
    )
    Logger.info('completed moveExpiredFinalConfirmToTop')
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
      const errorText = fromInvitation
        ? 'This invitation has already been accepted. Please contact with your landlord.'
        : 'You should have commit by your landlord to rent a property. Please contact with your landlord.'
      throw new AppException(errorText, 400)
    }

    if (existingMatch) {
      await Match.query()
        .update({
          status: MATCH_STATUS_FINISH,
          final_match_date: moment.utc(new Date()).format(DATE_FORMAT),
          status_at: moment.utc(new Date()).format(DATE_FORMAT)
        })
        .where({
          user_id: user.id,
          estate_id: estate_id,
          status: existingMatch.status
        })
        .transacting(trx)
    } else {
      await Match.createItem(
        { user_id: user.id, estate_id: estate_id, percent: 0, status: MATCH_STATUS_FINISH },
        trx
      )
    }

    await require('./TaskService').createGlobalTask(
      {
        tenantId: user.id,
        estateId: estate_id,
        landlordId: estate.user_id
      },
      trx
    )

    await EstateService.rented(estate_id, trx)
    await TenantService.updateTenantAddress({ user, address: estate.address }, trx)

    // need to make previous tasks which was between landlord and previous tenant archived
    await require('./TaskService').archiveTask(estate_id, trx)
    // unpublish estates on marketplace
    QueueService.estateSyncUnpublishEstates([estate_id], true)

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

      this.emitMatch({
        data: {
          estate_id: estateId,
          user_id: user.id,
          old_status: MATCH_STATUS_COMMIT,
          status: MATCH_STATUS_FINISH
        },
        role: ROLE_LANDLORD
      })

      this.emitMatch({
        data: {
          estate_id: estateId,
          user_id: user.id,
          old_status: MATCH_STATUS_COMMIT,
          status: MATCH_STATUS_FINISH
        },
        role: ROLE_LANDLORD,
        event: WEBSOCKET_EVENT_MATCH_STAGE
      })

      NoticeService.estateFinalConfirm(estateId, user.id)
      Event.fire('mautic:syncContact', user.id, { finalmatchapproval_count: 1 })

      let contact = await estate.getContacts(user.id)
      if (contact) {
        contact = contact.toJSON()
        contact.avatar = File.getPublicUrl(contact.avatar)
      }
      return { contact, estate }
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 500)
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

    if (estate.status === STATUS_OFFLINE_ACTIVE) {
      return await this.knockEstate({
        estate_id: estate.id,
        user_id: tenantId,
        share_profile: true,
        knock_anyway: true,
        buddy: true
      })
    } else {
      return await this.createBuddyMatch({ tenantId, estateId: estate.id })
    }
  }

  static async createBuddyMatch({ tenantId, estateId }) {
    const match = await Database.table('matches')
      .where({
        user_id: tenantId,
        estate_id: estateId
      })
      .first()

    if (!match) {
      const result = Database.table('matches').insert({
        user_id: tenantId,
        estate_id: estateId,
        percent: 0,
        buddy: true,
        status: MATCH_STATUS_NEW,
        status_at: moment.utc(new Date()).format(DATE_FORMAT)
      })
      return result
    }

    if (match.buddy) {
      throw new AppException('Already applied')
    }

    // Match exists but without buddy
    const buddyMatch = Database.table('matches')
      .update({ buddy: true, status_at: moment.utc(new Date()).format(DATE_FORMAT) })
      .where({
        user_id: tenantId,
        estate_id: estateId
      })

    this.emitMatch({
      data: {
        estate_id: estateId,
        user_id: tenantId,
        old_status: NO_MATCH_STATUS,
        status: MATCH_STATUS_NEW,
        buddy: true
      },
      role: ROLE_LANDLORD
    })

    this.emitMatch({
      data: {
        estate_id: estateId,
        user_id: tenantId,
        old_status: NO_MATCH_STATUS,
        status: MATCH_STATUS_NEW,
        buddy: true
      },
      role: ROLE_LANDLORD,
      event: WEBSOCKET_EVENT_MATCH_STAGE
    })
    return buddyMatch
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

  static getCountTenantMatchesWithFilterQuery(
    userId,
    { buddy, like, dislike, knock, invite, visit, share, top, commit, final }
  ) {
    return this.getTenantMatchesWithFilterQuery(userId, {
      buddy,
      like,
      dislike,
      knock,
      invite,
      visit,
      share,
      top,
      commit,
      final
    })
      .clearSelect()
      .clearOrder()
      .select(Database.raw(`count(DISTINCT("estates"."id"))`))
      .orderBy(
        Database.raw(`case when build_id is null then estates.id else estates.build_id end`),
        'asc'
      )
      .fetch()
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
      .select(
        Database.raw(
          `distinct on (case when build_id is null then estates.id else estates.build_id end) build_id`
        )
      )
      .select('estates.*')
      .select(
        Database.raw(
          'CAST(COALESCE(estates.rooms_number, 0) + COALESCE(estates.bedrooms_number, 0) + COALESCE(estates.bathrooms_number, 0) as INTEGER) as rooms_max'
        )
      )
      .select(Database.raw('1 as rooms_min'))
      .select(Database.raw(`true as inside`))
      .select('_m.prospect_score as match')
      .select('_m.updated_at', '_m.status_at')
      .withCount('notifications', function (n) {
        n.where('user_id', userId)
      })
      .orderBy(
        Database.raw(`case when build_id is null then estates.id else estates.build_id end`),
        'asc'
      )
      .orderBy('_m.updated_at', 'DESC')
      .whereIn('estates.status', defaultWhereIn)

    if (!like && !dislike) {
      query.innerJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id').on('_m.user_id', userId)
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
        .select(
          Database.raw(
            `distinct on (case when build_id is null then estates.id else estates.build_id end) build_id`
          )
        )
        .select('estates.*')
        .select('_m.updated_at', '_m.status_at')
        .select(Database.raw('"_l"."updated_at" as "action_at"'))
        .select(Database.raw('COALESCE(_m.prospect_score, 0) as match'))
        .innerJoin({ _l: 'likes' }, function () {
          this.on('_l.estate_id', 'estates.id').on('_l.user_id', userId)
        })
        .leftJoin({ _m: 'matches' }, function () {
          this.on('_m.estate_id', 'estates.id').on('_m.user_id', userId)
        })
        .where(function () {
          this.orWhere('_m.status', MATCH_STATUS_NEW).orWhereNull('_m.status')
        })
    } else if (dislike) {
      // All disliked estates
      query
        .clearSelect()
        .select(
          Database.raw(
            `distinct on (case when build_id is null then estates.id else estates.build_id end) build_id`
          )
        )
        .select('estates.*')
        .select('_m.updated_at', '_m.status_at')
        .select(Database.raw('_d.created_at as action_at'))
        .select(Database.raw('COALESCE(_m.prospect_score, 0) as match'))
        .innerJoin({ _d: 'dislikes' }, function () {
          this.on('_d.estate_id', 'estates.id').on('_d.user_id', userId)
        })
        .leftJoin({ _m: 'matches' }, function () {
          this.on('_m.estate_id', 'estates.id').on('_m.user_id', userId)
        })
        .where(function () {
          this.orWhere('_m.status', MATCH_STATUS_NEW).orWhereNull('_m.status')
        })
    } else if (knock) {
      query
        .select(Database.raw('_m.knocked_at as action_at'))
        .where({ '_m.status': MATCH_STATUS_KNOCK })
    } else if (invite) {
      query.where('_m.status', MATCH_STATUS_INVITE)

      query.innerJoin({ _t: 'time_slots' }, function () {
        this.on('_t.estate_id', 'estates.id').on(
          Database.raw(`end_at >= '${moment().utc(new Date()).format(DATE_FORMAT)}'`)
        )
      })
    } else if (visit) {
      // 2 conditions here
      // 1. There is a match with status VISIT and there is a not passed visit
      // 2. There is a match with status SHARE, match's share column is true (not cancelled), there is at least 1 visit
      query
        .where((query) => {
          query
            .where((innerQuery) => {
              innerQuery
                .where('_m.status', MATCH_STATUS_VISIT)
                .whereHas('visit_relations', (query) => {
                  query
                    .where('visits.user_id', userId)
                    .andWhere(
                      'visits.start_date',
                      '>=',
                      moment().utc(new Date()).format(DATE_FORMAT)
                    )
                })
            })
            .orWhere((innerQuery) => {
              innerQuery
                .where('_m.status', MATCH_STATUS_SHARE)
                .andWhere('_m.share', true)
                .whereHas('visit_relations', (query) => {
                  query.where('visits.user_id', userId)
                })
            })
        })
        .clearOrder()
        .orderBy(
          Database.raw(`case when build_id is null then estates.id else estates.build_id end`),
          'DESC'
        )
        .orderBy('_v.date', 'asc')
    } else if (share) {
      query
        .where({ '_m.share': true })
        .clearOrder()
        .orderBy(
          Database.raw(`case when build_id is null then estates.id else estates.build_id end`),
          'DESC'
        )
        .orderBy([
          { column: '_m.order_tenant', order: 'ASK' },
          { column: '_m.updated_at', order: 'DESC' }
        ])
    } else if (top) {
      query
        .innerJoin({ _u: 'users' }, '_u.id', 'estates.user_id')
        .leftJoin({ _t: 'tasks' }, function () {
          this.on('_t.tenant_id', '_m.user_id')
            .on('_t.estate_id', '_m.estate_id')
            .on('_t.type', TASK_SYSTEM_TYPE)
            .on('unread_role', ROLE_USER)
            .on('unread_count', '>', 0)
        })
        .select(Database.raw(`coalesce(_t.unread_count, 0) as unread_count`))
        .select('_u.avatar', '_u.firstname', '_u.secondname', '_u.sex')
        //.where({ '_m.status': MATCH_STATUS_TOP, share: true })
        .where({ '_m.status': MATCH_STATUS_TOP })
        .clearOrder()
        .orderBy(
          Database.raw(`case when build_id is null then estates.id else estates.build_id end`),
          'DESC'
        )
        .orderBy([
          { column: '_m.order_tenant', order: 'ASK' },
          { column: '_m.updated_at', order: 'DESC' }
        ])
    } else if (commit) {
      query
        .innerJoin({ _u: 'users' }, '_u.id', 'estates.user_id')
        .leftJoin({ _t: 'tasks' }, function () {
          this.on('_t.tenant_id', '_m.user_id')
            .on('_t.estate_id', '_m.estate_id')
            .on('_t.type', TASK_SYSTEM_TYPE)
            .on('unread_role', ROLE_USER)
            .on('unread_count', '>', 0)
        })
        .select(Database.raw(`coalesce(_t.unread_count, 0) as unread_count`))

        .select('_u.email', '_u.phone', '_u.avatar', '_u.firstname', '_u.secondname', '_u.sex')
        .whereIn('_m.status', [MATCH_STATUS_COMMIT])
        .where('_m.share', true)
    } else if (final) {
      query
        .innerJoin({ _u: 'users' }, '_u.id', 'estates.user_id')
        .leftJoin({ _t: 'tasks' }, function () {
          this.on('_t.tenant_id', '_m.user_id')
            .on('_t.estate_id', '_m.estate_id')
            .on('_t.type', TASK_SYSTEM_TYPE)
            .on('unread_role', ROLE_USER)
            .on('unread_count', '>', 0)
        })
        .select(Database.raw(`coalesce(_t.unread_count, 0) as unread_count`))

        .select('_u.email', '_u.phone', '_u.avatar', '_u.firstname', '_u.secondname', '_u.sex')
        .withCount('tenant_has_unread_task')
        .withCount('all_tasks')
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
      'estates.available_start_at',
      'estates.available_end_at',
      'estates.status as estate_status',
      '_m.status as status',
      '_m.buddy',
      '_m.share',
      '_m.knocked_at',
      '_v.date',
      '_v.start_date AS visit_start_date',
      '_v.end_date AS visit_end_date',
      '_v.tenant_status AS visit_status',
      '_v.tenant_delay AS delay'
    )

    return query
  }

  static getTenantUpcomingVisits(userId) {
    const now = moment.utc().format(DATE_FORMAT)
    const query = Estate.query()
      .select('estates.*')
      .select('_m.prospect_score as match')
      .select('_m.updated_at', '_m.status_at')
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
    const now = moment.utc().format(DATE_FORMAT)

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
    // const estates = await Estate.query()
    //   .select('status', 'id')
    //   .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])
    //   .fetch()
    // const estatesJson = estates.toJSON({ isShort: true })
    // const estateIds = estatesJson.map(estate => estate.id)
    const datas = await Promise.all([
      this.getTenantLikesCount(userId),
      this.getTenantDislikesCount(userId),
      this.getTenantKnocksCount(userId),
      this.getTenantSharesCount(userId),
      this.getTenantInvitesCount(userId),
      this.getTenantVisitsCount(userId),
      this.getTenantCommitsCount(userId),
      this.getTenantTopsCount(userId),
      this.getTenantBuddiesCount(userId),
      this.getTenantFinalMatchesCount(userId),

      require('./ThirdPartyOfferService').getKnockedCount(userId),
      require('./ThirdPartyOfferService').getLikesCount(userId),
      require('./ThirdPartyOfferService').getDisLikesCount(userId)
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

    const [{ count: third_knocksCount }] = datas[10]
    const [{ count: third_likesCount }] = datas[11]
    const [{ count: third_dislikesCount }] = datas[12]
    return {
      like: parseInt(likesCount) + parseInt(third_likesCount) || 0,
      dislike: parseInt(dislikesCount) + parseInt(third_dislikesCount) || 0,
      knock: parseInt(knocksCount) + parseInt(third_knocksCount) || 0,
      share: parseInt(sharesCount),
      visit: parseInt(invitesCount) + parseInt(visitsCount),
      commit: parseInt(commitsCount),
      decide: parseInt(commitsCount) + parseInt(topsCount),
      buddy: parseInt(buddiesCount),
      final: parseInt(finalMatchesCount)
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
        MatchService.getTenantVisitsCount(userId, estateIds)
      ])
      const [{ count: invitesCount }] = datas[0]
      const [{ count: visitsCount }] = datas[1]
      return {
        invite: parseInt(invitesCount),
        visit: parseInt(visitsCount),
        stage: parseInt(invitesCount) + parseInt(visitsCount)
      }
    } else if (filter === 'decide') {
      const datas = await Promise.all([
        MatchService.getTenantTopsCount(userId, estateIds),
        MatchService.getTenantCommitsCount(userId, estateIds)
      ])
      const [{ count: topsCount }] = datas[0]
      const [{ count: commitsCount }] = datas[1]
      return {
        top: parseInt(topsCount),
        commit: parseInt(commitsCount),
        stage: parseInt(topsCount) + parseInt(commitsCount)
      }
    } else {
      throw new HttpException('Invalid stage', 400)
    }
  }

  static async getTenantLikesCount(userId) {
    const estates = await Estate.query()
      .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])
      .select(
        Database.raw(
          `distinct on (case when build_id is null then estates.id else estates.build_id end) build_id`
        )
      )
      .innerJoin({ _l: 'likes' }, function () {
        this.on('_l.estate_id', 'estates.id').onIn('_l.user_id', userId)
      })
      .leftJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id').onIn('_m.user_id', userId)
      })
      .where(function () {
        this.orWhere('_m.status', MATCH_STATUS_NEW).orWhereNull('_m.status')
      })
      .orderBy(
        Database.raw(`case when build_id is null then estates.id else estates.build_id end`),
        'DESC'
      )
      .fetch()
    return [{ count: estates.rows.length }]
  }

  static async getTenantDislikesCount(userId) {
    const estates = await Estate.query()
      .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])
      .select(
        Database.raw(
          `distinct on (case when build_id is null then estates.id else estates.build_id end) build_id`
        )
      )
      .innerJoin({ _l: 'dislikes' }, function () {
        this.on('_l.estate_id', 'estates.id').onIn('_l.user_id', userId)
      })
      .leftJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id').onIn('_m.user_id', userId)
      })
      .where(function () {
        this.orWhere('_m.status', MATCH_STATUS_NEW).orWhereNull('_m.status')
      })
      .orderBy(
        Database.raw(`case when build_id is null then estates.id else estates.build_id end`),
        'DESC'
      )

      .fetch()

    const trashEstates = await EstateService.getTenantTrashEstates(userId)

    return [{ count: estates.rows.length + trashEstates.rows.length }]
  }

  static async getTenantKnocksCount(userId) {
    const estates = await Match.query()
      .select(
        Database.raw(
          `distinct on (case when build_id is null then _e.id else _e.build_id end) build_id`
        )
      )
      .innerJoin({ _e: 'estates' }, '_e.id', 'matches.estate_id')
      .where('matches.user_id', userId)
      .where('matches.status', MATCH_STATUS_KNOCK)
      .whereIn('_e.status', [STATUS_ACTIVE, STATUS_EXPIRE])
      .orderBy(Database.raw(`case when build_id is null then _e.id else _e.build_id end`), 'DESC')
      .fetch()

    return [{ count: estates.rows.length }]
  }

  static async getMatchNewCount(userId) {
    const data = await Database.table('matches')
      .where('matches.user_id', userId)
      .where('matches.status', MATCH_STATUS_NEW)
      .innerJoin({ _e: 'estates' }, function () {
        this.on('_e.id', 'matches.estate_id').onIn('_e.status', [STATUS_ACTIVE, STATUS_EXPIRE])
      })
      .count('*')
    return data
  }
  // Find the invite matches but has available time slots
  static async getTenantInvitesCount(userId) {
    const data = await Estate.query()
      .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
      .whereHas('matches', (query) => {
        query.where('matches.user_id', userId).where('matches.status', MATCH_STATUS_INVITE)
      })
      .whereHas('slots', (query) => {
        query.where('time_slots.end_at', '>', moment().utc(new Date()).format(DATE_FORMAT))
      })
      .count('*')
    return data
  }

  // 2 cases:
  // Match status should be VISIT and there should be a visit that date is greater than current date
  // Match status should be SHARE, share should not be cancelled and there should be at least 1 visit
  static async getTenantVisitsCount(userId) {
    const data = await Estate.query()
      .where((estateQuery) => {
        estateQuery
          .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])
          .whereHas('matches', (query) => {
            query.where('matches.user_id', userId).where('matches.status', MATCH_STATUS_VISIT)
          })
          .whereHas('visit_relations', (query) => {
            query
              .where('visits.user_id', userId)
              .andWhere('visits.start_date', '>=', moment().utc(new Date()).format(DATE_FORMAT))
          })
      })
      .orWhere((estateQuery) => {
        estateQuery
          .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])
          .whereHas('matches', (query) => {
            query
              .where('matches.status', MATCH_STATUS_SHARE)
              .where('matches.share', true)
              .where('matches.user_id', userId)
          })
          .whereHas('visit_relations', (query) => {
            query.where('visits.user_id', userId)
          })
      })
      .count('*')

    return data
  }

  static async getTenantSharesCount(userId) {
    const data = await Database.table('matches')
      .where({ share: true })
      .where('matches.user_id', userId)
      .innerJoin({ _e: 'estates' }, function () {
        this.on('_e.id', 'matches.estate_id').onIn('_e.status', [STATUS_ACTIVE, STATUS_EXPIRE])
      })
      .count('*')
    return data
  }

  static async getTenantTopsCount(userId) {
    const data = await Database.table('matches')
      .where({ share: true })
      .where('matches.user_id', userId)
      .where('matches.status', MATCH_STATUS_TOP)
      .innerJoin({ _e: 'estates' }, function () {
        this.on('_e.id', 'matches.estate_id').onIn('_e.status', [STATUS_ACTIVE, STATUS_EXPIRE])
      })
      .count('*')
    return data
  }

  static async getUserToChat({ user_id, estate_id, role }) {
    let query = Match.query()
      .select('_e.user_id as estate_user_id')
      .select('matches.user_id as tenant_user_id')
      .where(function () {
        this.orWhere('matches.status', '>=', MATCH_STATUS_TOP)
        this.orWhere(function () {
          this.where('_e.is_not_show', true)
          this.orWhere('matches.status', '>=', MATCH_STATUS_NEW)
        })
      })

      .where('estate_id', estate_id)

    if (role === ROLE_LANDLORD) {
      query.innerJoin({ _e: 'estates' }, function () {
        this.on('_e.id', 'matches.estate_id')
          .on('_e.user_id', user_id)
          .onNotIn('_e.status', [STATUS_DELETE])
      })
    } else {
      query.innerJoin({ _e: 'estates' }, function () {
        this.on('_e.id', 'matches.estate_id').onNotIn('_e.status', [STATUS_DELETE])
      })

      query.where('matches.user_id', user_id)
    }

    return await query.first()
  }

  static async getTenantCommitsCount(userId) {
    const data = await Database.table('matches')
      .where({ share: true })
      .where('matches.user_id', userId)
      .where('matches.status', MATCH_STATUS_COMMIT)
      .innerJoin({ _e: 'estates' }, function () {
        this.on('_e.id', 'matches.estate_id').onIn('_e.status', [STATUS_ACTIVE, STATUS_EXPIRE])
      })
      .count('*')
    return data
  }

  static async getTenantFinalMatchesCount(userId) {
    const data = await Database.table('matches')
      .where('matches.user_id', userId)
      .where('matches.status', MATCH_STATUS_FINISH)
      .innerJoin({ _e: 'estates' }, function () {
        this.on('_e.id', 'matches.estate_id').on('_e.status', STATUS_DRAFT)
      })
      .count('*')
    return data
  }

  static async getTenantBuddiesCount(userId) {
    const data = await Database.table('matches')
      .where({ buddy: true })
      .where('matches.user_id', userId)
      .where('matches.status', MATCH_STATUS_NEW)
      .innerJoin({ _e: 'estates' }, function () {
        this.on('_e.id', 'matches.estate_id').onIn('_e.status', [STATUS_ACTIVE, STATUS_EXPIRE])
      })
      .count('*')
    return data
  }

  static searchForTenant(userId, params = {}) {
    const query = Estate.query()
      .select('estates.*')
      .select('_m.prospect_score as match')
      .select('_m.updated_at', '_m.status_at')
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
    const query = EstateService.getEstates(userId)
      .select('*')
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

  static getLandlordMatchesFilterSQL(
    estate,
    { knock, buddy, invite, visit, top, commit, final },
    params
  ) {
    const query = Tenant.query()
      .innerJoin({ _u: 'users' }, 'tenants.user_id', '_u.id')
      .innerJoin({ _m: 'matches' }, function () {
        this.on('_m.user_id', '_u.id').onIn('_m.estate_id', [estate?.id || params?.estate_id])
      })
      .orderBy('tenants.id', 'ASC')
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
          { column: 'tenants.id', order: 'ASC' },
          { column: '_m.order_lord', order: 'ASC' },
          { column: '_m.updated_at', order: 'DESC' }
        ])
    } else if (commit) {
      query.whereIn('_m.status', [MATCH_STATUS_COMMIT, MATCH_STATUS_FINISH])
    } else if (final) {
      query.whereIn('_m.status', [MATCH_STATUS_FINISH])
    }

    if (top || commit || final) {
      query.leftJoin({ _t: 'tasks' }, function () {
        this.on('_t.tenant_id', '_m.user_id')
          .on('_t.estate_id', '_m.estate_id')
          .on('_t.estate_id', estate.id)
          .on('_t.type', TASK_SYSTEM_TYPE)
          .on('unread_role', ROLE_LANDLORD)
          .on('unread_count', '>', 0)
      })
    }

    if (params?.user_id) {
      query.where('_m.user_id', params.user_id)
    }
    if (params?.matchStatus) {
      query.where('_m.status', params.matchStatus)
    }

    query
      .leftJoin({ _v: 'visits' }, function () {
        this.on('_v.user_id', '_m.user_id').on('_v.estate_id', '_m.estate_id')
      })
      .leftJoin({ _mb: 'members' }, function () {
        //primaryUser?
        this.on(
          Database.raw(
            `( _mb.user_id = tenants.user_id and _mb.owner_user_id is null ) or ( _mb.owner_user_id = tenants.user_id and _mb.owner_user_id is not null )`
          )
        )
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
                  income_proofs.income_id = incomes.id and income_proofs.status = ${STATUS_ACTIVE}
                where incomes.status = ${STATUS_ACTIVE}  
                group by incomes.id) as _mip
              on
                _mip.id=incomes.id and incomes.status = ${STATUS_ACTIVE}
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
            (array_agg(incomes.income_type order by incomes.income desc)) as profession
          from
            members as primaryMember
          left join
            incomes
          on
            primaryMember.id=incomes.member_id and incomes.status = ${STATUS_ACTIVE}
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
        this.on('tenants.user_id', '_bd.tenant_id')
        if (estate) {
          this.on('_bd.user_id', estate.user_id)
        }
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

    if (parseInt(params?.budget_min || 0) !== 0) {
      if (params && params.budget_min > 0 && params.budget_max > 0) {
        query.where(function () {
          this.orWhere(function () {
            this.andWhere('tenants.budget_max', '>=', params.budget_min).andWhere(
              'tenants.budget_max',
              '<=',
              params.budget_max
            )
          })
          this.orWhere(function () {
            this.andWhere('tenants.budget_min', '>=', params.budget_min).andWhere(
              'tenants.budget_min',
              '<=',
              params.budget_max
            )
          })
        })
      } else if (params && params.budget_min > 0 && !params.budget_max) {
        query.where('tenants.budget_min', '>=', params.budget_min)
      } else if (params && !params.budget_min && params.budget_max > 0) {
        query.where('tenants.budget_max', '<=', params.budget_max)
      }
    }
    /*
    if (
      parseInt(params?.credit_score_min || 0) !== 0 ||
      parseInt(params?.credit_score_max || 100) !== 100
    ) {
      if (params && params?.credit_score_min > 0) {
        query.where('tenants.credit_score', '>=', params.credit_score_min)
      }
      if (params && params.credit_score_max) {
        query.where('tenants.credit_score', '<=', params.credit_score_max)
      }
    }*/
    if (params && params.phone_verified) {
      query.where('_mb.phone_verified', true).where('_mb.is_verified', true)
    }
    if (params && params.id_verified) {
      query.where('_mf.id_verified', true)
    }
    if (params && params.income_type && params.income_type.length) {
      query.andWhere(function () {
        params.income_type.map((income_type) => {
          this.query.orWhere(Database.raw(`'${income_type}' = any(_pm.profession)`))
        })
      })
    }

    return query
  }

  static async getCountLandlordMatchesWithFilterQuery(
    estate,
    { knock, buddy, invite, visit, top, commit, final },
    params
  ) {
    let query = this.getLandlordMatchesFilterSQL(
      estate,
      { knock, buddy, invite, visit, top, commit, final },
      params
    )

    return await query.clearSelect().clearOrder().count(Database.raw(`DISTINCT(tenants.id)`))
  }

  /**
   * Get tenants matched to current estate
   */
  static getLandlordMatchesWithFilterQuery(
    estate,
    { knock, buddy, invite, visit, top, commit, final },
    params
  ) {
    let query = this.getLandlordMatchesFilterSQL(
      estate,
      { knock, buddy, invite, visit, top, commit, final },
      params
    )

    query
      .with('certificates')
      .select(Database.raw(`DISTINCT ON ( "tenants"."id") "tenants"."id"`))

      .select([
        'tenants.*',
        '_u.firstname as u_firstname',
        '_u.secondname as u_secondname',
        '_u.birthday as u_birthday',
        '_u.avatar as u_avatar',
        '_u.sex',
        '_u.email',
        '_u.code',
        '_v.landlord_followup_meta as followups'
      ])
      .select(
        '_m.updated_at',
        '_m.landlord_score as percent',
        '_m.share',
        '_m.inviteIn',
        '_m.status_at',
        '_m.final_match_date'
      )
      .select('_u.email', '_u.phone', '_u.status as u_status')
      .select(`_pm.profession`)
      .select(`_mf.id_verified`)
      .select('_mb.firstname', '_mb.secondname', '_mb.birthday', '_mb.credit_score')
      .select(
        Database.raw(`
        (case when _bd.user_id is null
          then
            '${MATCH_TYPE_MATCH}'
          else
            '${MATCH_TYPE_BUDDY}'
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
    if (top || commit || final) {
      query.select(Database.raw(`coalesce(_t.unread_count, 0) as unread_count`))
    }
    query.select(
      '_mb.firstname',
      '_mb.secondname',
      '_mb.birthday',
      '_mb.avatar',
      '_mb.last_address',
      '_mb.phone_verified',
      '_mb.is_verified',
      '_mb.credit_history_status',
      '_mb.credit_score_issued_at',
      '_mb.debt_proof',
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
      '_mf.id_verified',
      '_m.final_match_date'
    )

    return query
  }

  static async getMatchesByFilter(estate, filter, params = {}) {
    if (!params.budget_min) {
      params.budget_min = 0
    }
    if (!params.budget_max) {
      params.budget_max = 100
    }
    if (!params.credit_score_min) {
      params.credit_score_min = 0
    }
    if (!params.credit_score_max) {
      params.credit_score_max = 100
    }

    const budetLimitCount = (
      await this.getCountLandlordMatchesWithFilterQuery(estate, filter, {
        budget_min: params.budget_min,
        budget_max: params.budget_max
      })
    )[0].count

    const phoneVerifiedCount = (
      await this.getCountLandlordMatchesWithFilterQuery(estate, filter, {
        phone_verified: true
      })
    )[0].count
    const idVeriedCount = (
      await this.getCountLandlordMatchesWithFilterQuery(estate, filter, {
        id_verified: true
      })
    )[0].count

    const creditScoreLimitCount = (
      await this.getCountLandlordMatchesWithFilterQuery(estate, filter, {
        credit_score_min: params.credit_score_min,
        credit_score_max: params.credit_score_max
      })
    )[0].count

    const incomeTypes = [
      INCOME_TYPE_EMPLOYEE,
      INCOME_TYPE_WORKER,
      INCOME_TYPE_UNEMPLOYED,
      INCOME_TYPE_CIVIL_SERVANT,
      INCOME_TYPE_FREELANCER,
      INCOME_TYPE_HOUSE_WORK,
      INCOME_TYPE_PENSIONER,
      INCOME_TYPE_SELF_EMPLOYED,
      INCOME_TYPE_TRAINEE,
      INCOME_TYPE_OTHER_BENEFIT,
      INCOME_TYPE_CHILD_BENEFIT
    ]

    const incomeMatches = (
      await this.getLandlordMatchesWithFilterQuery(estate, filter, {
        income_type: incomeTypes
      }).fetch()
    ).rows

    const incomeCount = (incomeTypes || []).map((it) => {
      return {
        key: it,
        count: countBy(incomeMatches, (match) => (match.profession || []).includes(it)).true || 0
      }
    })

    return {
      budget: budetLimitCount,
      credit_score: creditScoreLimitCount,
      income: incomeCount,
      phoneVerified: phoneVerifiedCount,
      idVerified: idVeriedCount
    }
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
        { column: '_m.updated_at', order: 'DESC' }
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
        isTenant ? user.id : userId
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
      bookedSlotsCount: getBookedSlots()
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
    const currentDay = moment.utc().startOf('day')
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
        'estates.address',
        'estates.id',
        'estates.user_id',
        'budget',
        'rent_arrears',
        'min_age',
        'max_age',
        'family_size_min',
        'family_size_max',
        'pets_allowed',
        'net_rent',
        'rooms_number',
        'number_floors',
        'house_type',
        'vacant_date',
        'amenities.options',
        'area',
        'apt_type',
        'income_sources',
        '_ec.wbs_certificate',
        'property_id',
        'build_id',
        'unit_category_id'
      )
      .leftJoin(
        Database.raw(`
        (select estates.id as estate_id,
          case when estates.cert_category is null then
            null else 
            json_build_object('city_id', cities.id, 'income_level', estates.cert_category)
            end
          as wbs_certificate from estates left join cities on cities.city=estates.city)
        as _ec`),
        function () {
          this.on('_ec.estate_id', 'estates.id')
        }
      )
      .leftJoin(
        Database.raw(`
        (select estate_id, json_agg(option_id) as options
        from amenities where type='amenity' and location in
        ('build', 'apt', 'out') group by estate_id) as amenities
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
        'tenants.residency_duration_min',
        'tenants.residency_duration_max',
        'tenants.is_short_term_rent',
        Database.raw(`_me.total_income as income`), //sum of all member's income
        '_m.credit_history_status',
        'rent_arrears', //if at least one has true, then true
        '_me.income_proofs', //all members must submit at least 3 income proofs for each of their incomes for this to be true
        '_m.credit_score_proofs', //all members must submit their credit score proofs
        '_m.no_rent_arrears_proofs', //all members must submit no_rent_arrears_proofs
        '_m.members_age',
        '_m.members_count', //adult members only
        'pets',
        'budget_min',
        'budget_max',
        'transfer_budget_min',
        'transfer_budget_max',
        Database.raw(`(100*budget_max/_me.total_income) as budget_max_scale`),
        'rent_start',
        'options', //array
        'space_min',
        'space_max',
        'floor_min',
        'floor_max',
        'rooms_min',
        'rooms_max',
        'house_type', //array
        'apt_type', //array
        '_tc.wbs_certificate',
        'tenants.income_level',
        'tenants.is_public_certificate'
      )
      .leftJoin(
        //members...
        Database.raw(`
      (select
        user_id, owner_user_id,
        json_agg(json_build_object('status', credit_history_status)) as credit_history_status,
        count(id) as members_count,
        bool_and(coalesce(debt_proof, null) is not null) as credit_score_proofs,
        bool_and(coalesce(rent_arrears_doc, '') <> '') as no_rent_arrears_proofs,
        bool_or(unpaid_rental='${YES_UNPAID_RENTAL}' is true) as rent_arrears,
        -- sum(income) as income,
        json_agg(extract(year from age(${Database.fn.now()}, birthday)) :: int) as members_age
      from members
      group by user_id,owner_user_id
      ) as _m
      `),
        function () {
          this.on(
            Database.raw(
              `( _m.user_id = tenants.user_id and _m.owner_user_id is null ) or ( _m.owner_user_id = tenants.user_id and _m.owner_user_id is not null )`
            )
          )
        }
      )
      .leftJoin(
        Database.raw(`
        (select
          user_id,
          status, 
          case when income_level is null or income_level='' then
            null else
            json_build_object('city_id', city_id, 'income_level', income_level)
            end
            as wbs_certificate
          from tenant_certificates
          where expired_at > NOW()
          ) as _tc
        `),
        function () {
          this.on(Database.raw(`(tenants.user_id=_tc.user_id)`)).on(`_tc.status`, STATUS_ACTIVE)
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
                income_proofs.income_id = incomes.id and income_proofs.status = ${STATUS_ACTIVE}
              group by incomes.id) as _mip
            on
              _mip.id=incomes.id and incomes.status = ${STATUS_ACTIVE}
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
    let estates =
      (
        await MatchService.getEstateForScoringQuery().whereIn('estates.id', estateIds).fetch()
      ).toJSON() || []

    let passedEstates = []
    let idx = 0
    prospect.incomes = await require('./MemberService').getIncomes(userId)
    while (idx < estates.length) {
      const { percent, landlord_score, prospect_score } = await MatchService.calculateMatchPercent(
        prospect,
        estates[idx]
      )
      passedEstates.push({ estate_id: estates[idx].id, percent, landlord_score, prospect_score })
      idx++
    }

    const matchScores = passedEstates.map((i) => ({
      user_id: userId,
      estate_id: i.estate_id,
      percent: i.percent,
      landlord_score: i.landlord_score,
      prospect_score: i.prospect_score
    }))

    if (!isEmpty(matchScores)) {
      const insertQuery = Database.query().into('matches').insert(matchScores).toString()
      await Database.raw(
        `${insertQuery} ON CONFLICT (user_id, estate_id) 
          DO UPDATE SET "percent" = EXCLUDED.percent, "landlord_score" = EXCLUDED.landlord_score, "prospect_score" = EXCLUDED.prospect_score`
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

    userIds.map((userId) => {
      MatchService.emitMatch({
        data: {
          estate_id,
          user_id: userId,
          old_status: MATCH_STATUS_KNOCK,
          status: MATCH_STATUS_INVITE
        },
        role: ROLE_USER
      })
    })

    return userIds
  }

  static async getEstatesByStatus({ estate_id, status }) {
    let query = Match.query()
    if (estate_id) {
      query.where('estate_id', estate_id)
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
        MATCH_STATUS_FINISH
      ],
      [id]
    )
  }

  static async checkUserHasFinalMatch(user_id) {
    try {
      const [{ count }] = await Database.table('matches')
        .where('status', MATCH_STATUS_FINISH)
        .where('user_id', user_id)
        .count('*')
      return parseInt(count) > 0
    } catch (e) {
      console.log(e)
      return false
    }
  }

  static async getVisitsIn({ estate_id, start_at, end_at }) {
    const startAt = Database.raw(
      `_v.start_date + GREATEST(_v.tenant_delay, _v.lord_delay) * INTERVAL '1 minute'`
    )
    const endAt = Database.raw(
      `_v.end_date + GREATEST(_v.tenant_delay, _v.lord_delay) * INTERVAL '1 minute'`
    )

    const visits = (
      await Match.query()
        .select('matches.user_id', 'matches.estate_id', '_v.start_date', '_v.end_date')
        .where('matches.estate_id', estate_id)
        .whereIn('matches.status', [MATCH_STATUS_VISIT])
        .innerJoin({ _v: 'visits' }, function () {
          this.on('matches.estate_id', '_v.estate_id')
            .on('matches.user_id', '_v.user_id')
            .onNotIn('_v.tenant_status', [TIMESLOT_STATUS_REJECT])
        })
        .where(startAt, '>=', start_at)
        .where(endAt, '<=', end_at)
        .fetch()
    ).rows

    return visits
  }

  static async getInvitedUserIds(estate_id) {
    const invitedMatches = await MatchService.getEstatesByStatus({
      estate_id,
      status: MATCH_STATUS_INVITE
    })
    const invitedUserIds = (invitedMatches || []).map((match) => match.user_id)
    return invitedUserIds
  }

  static async deletePermanant({ user_id, estate_id }) {
    let query = Match.query().delete().where('user_id', user_id)
    if (estate_id) {
      query.where('estate_id', estate_id)
    }
    await query
  }

  static async getMatchStageList({ user_id, params, page = -1, limit = -1 }) {
    let estate = await Estate.query()
      .where('id', params.estate_id)
      .where('user_id', user_id)
      .withCount('knocked')
      .withCount('inviteBuddies')
      .withCount('visits')
      .withCount('decided')
      .first()

    if (!estate) {
      throw new HttpException(ESTATE_NOT_EXISTS, 400)
    }

    estate = estate.toJSON()
    const inviteQuery = this.getMatchStageQuery({ params })
    let match = null
    let count = 0
    if (limit === -1 || page === -1) {
      match = await inviteQuery.fetch()
      count = match.rows?.length || 0
    } else {
      match = await inviteQuery.paginate(page, limit)
      count = (
        await inviteQuery
          .clearSelect()
          .count(Database.raw(`DISTINCT("matches"."user_id", "matches"."estate_id")`))
      )[0].count
    }
    let invite_count = 0

    if (params.match_status.includes(MATCH_STATUS_KNOCK)) {
      invite_count = parseInt(estate?.__meta__?.inviteBuddies_count || 0) + parseInt(count)
    } else if (params.buddy) {
      invite_count = parseInt(estate?.__meta__?.knocked_count || 0) + parseInt(count)
    }

    estate.__meta__.invite_count = invite_count.toString()
    return {
      estate,
      match: match.toJSON({ isShort: true }),
      count
    }
  }

  static getMatchStageQuery({ params }) {
    let inviteQuery = Match.query()
      .select('matches.*')
      .select('_u.firstname', '_u.secondname', '_u.birthday', '_u.avatar')
      .select('_t.members_count', '_t.minors_count', '_t.income')
      .select(
        '_m.credit_score_proofs',
        '_m.no_rent_arrears_proofs',
        '_m.rent_arrears',
        '_m.members_age',
        '_me.income_sources',
        '_me.work_exp',
        '_me.income_contract_end',
        '_me.total_work_exp',
        '_me.income_proofs',
        '_me.income_proofs'
      )
      .leftJoin({ _u: 'users' }, function () {
        this.on('_u.id', 'matches.user_id')
      })
      .leftJoin({ _t: 'tenants' }, function () {
        this.on('_t.user_id', '_u.id')
      })
      .leftJoin(
        //members...
        Database.raw(`
      (select
        user_id,
        count(id) as members_count,
        bool_and(coalesce(debt_proof, null) is not null) as credit_score_proofs,
        bool_and(coalesce(rent_arrears_doc, '') <> '') as no_rent_arrears_proofs,
        bool_or(coalesce(unpaid_rental, 0) > 0) as rent_arrears,
        -- sum(income) as income,
        array_agg(extract(year from age(${Database.fn.now()}, birthday)) :: int) as members_age
      from members
      group by user_id
      ) as _m
      `),
        function () {
          this.on('_t.user_id', '_m.user_id')
        }
      )
      .leftJoin(
        //members incomes and income_proofs
        Database.raw(`
        (-- tenant has members
          select
            members.user_id,
            sum(member_total_income) as total_income,
            coalesce(bool_and(_mi.incomes_has_all_proofs), false) as income_proofs,
            json_agg(_mi.income_type) as income_sources,
            json_agg(work_exp) as work_exp,
            json_agg(income_contract_end) as income_contract_end,
            sum(work_exp) as total_work_exp
          from
            members
          left join
            (
            -- whether or not member has all proofs, get also member's total income
            select
              incomes.member_id,
              incomes.income_contract_end,
              sum(_mip.income) as member_total_income,
              incomes.income_type,
              coalesce(incomes.work_exp, 0) as work_exp,
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
                income_proofs.income_id = incomes.id and income_proofs.status = ${STATUS_ACTIVE}
              group by incomes.id) as _mip
            on
              _mip.id=incomes.id and incomes.status = ${STATUS_ACTIVE}
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

    const filter = new MatchFilters(params, inviteQuery)
    inviteQuery = filter.process()

    if (params.match_status) {
      inviteQuery.whereIn('matches.status', params.match_status)
    }
    if (params.buddy) {
      inviteQuery.where('matches.buddy', true)
      inviteQuery.where('matches.status', MATCH_STATUS_NEW)
    }

    inviteQuery.where('estate_id', params.estate_id)
    return inviteQuery
  }

  static getMatchListQuery(user_id, params = {}) {
    let matchQuery = require('./EstateService').getActiveEstateQuery()
    matchQuery = new EstateFilters(params, matchQuery).process()
    return matchQuery
  }

  static async getMatchList(user_id, params = {}) {
    let matchQuery = this.getMatchListQuery(user_id, params)
    matchQuery
      .where('user_id', user_id)
      .withCount('knocked')
      .withCount('invited')
      .withCount('visited')
      .withCount('decided')
      .withCount('final')
    matchQuery.orderBy('estates.id', 'desc')
    if (params.page && params.page !== -1 && params.limit && params.limit !== -1) {
      return await matchQuery.paginate(params.page, params.limit)
    }
    return await matchQuery.fetch()
  }

  static async getCountMatchList(user_id, params = {}) {
    return await this.getMatchListQuery(user_id, params).count()
  }

  /**
   * Get count of inside new matches for a prospect
   */
  static async getNewMatchCount(userId) {
    return (
      (
        await Estate.query()
          .count(
            Database.raw(
              `distinct case when estates.build_id is null then estates.id else estates.build_id end`
            )
          )
          .innerJoin({ _m: 'matches' }, function () {
            this.on('_m.estate_id', 'estates.id')
              .onIn('_m.user_id', [userId])
              .onIn('_m.status', [MATCH_STATUS_NEW])
          })
          .whereNot('_m.buddy', true)
          .where('estates.status', STATUS_ACTIVE)
          .whereNotIn('estates.id', function () {
            // Remove already liked/disliked
            this.select('estate_id')
              .from('likes')
              .where('user_id', userId)
              .union(function () {
                this.select('estate_id').from('dislikes').where('user_id', userId)
              })
          })
      )?.[0]?.count || 0
    )
  }

  static async hasInteracted({ userId, estateId }) {
    return await Match.query()
      .where('estate_id', estateId)
      .where('user_id', userId)
      .where(function () {
        this.orWhere('status', '>=', MATCH_STATUS_KNOCK)
        this.orWhere(function () {
          this.where('buddy', true)
          this.where('status', MATCH_STATUS_NEW)
        })
      })
      .first()
  }

  static async getKnockedPosition({ user_id, estate_id }) {
    const matches = (
      await Match.query()
        .where('estate_id', estate_id)
        .orderBy('status', 'desc')
        .orderBy('percent', 'desc')
        .orderBy('id')
        .fetch()
    ).toJSON()

    const placeNumber = (matches || []).findIndex((match) => match.user_id === user_id)
    if (placeNumber == -1) {
      throw new HttpException(NO_MATCH_EXIST, 400)
    }
    return {
      match: matches?.[placeNumber],
      place_num: placeNumber + 1
    }
  }
}

module.exports = MatchService
