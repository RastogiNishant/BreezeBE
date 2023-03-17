const { toLower, isArray, isEmpty, trim, includes, isBoolean } = require('lodash')
const Database = use('Database')
const {
  LETTING_TYPE_LET,
  LETTING_TYPE_VOID,
  LETTING_TYPE_NA,
  LETTING_STATUS_STANDARD,
  LETTING_STATUS_VACANCY,
  LETTING_STATUS_TERMINATED,
  STATUS_ACTIVE,
  STATUS_DRAFT,
  STATUS_EXPIRE,
  PROPERTY_TYPE_APARTMENT,
  PROPERTY_TYPE_ROOM,
  PROPERTY_TYPE_HOUSE,
  PROPERTY_TYPE_SITE,
  PROPERTY_TYPE_OFFICE,
  ESTATE_VALID_ADDRESS_LABEL,
  ESTATE_INVALID_ADDRESS_LABEL,
  ESTATE_ALL_ADDRESS_LABEL,
  ESTATE_FLOOR_DIRECTION_LEFT,
  ESTATE_FLOOR_DIRECTION_NA,
  ESTATE_FLOOR_DIRECTION_RIGHT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT_LEFT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT_RIGHT,
  LETTING_STATUS_NEW_RENOVATED,
  MATCH_STATUS_NEW,
} = require('../constants')
const Filter = require('./Filter')

class EstateFilters extends Filter {
  static lettingTypeString = {
    let: LETTING_TYPE_LET,
    void: LETTING_TYPE_VOID,
    na: LETTING_TYPE_NA,
  }
  static lettingStatusString = {
    new_renovated: LETTING_STATUS_NEW_RENOVATED,
    standard: LETTING_STATUS_STANDARD,
    vacancy: LETTING_STATUS_VACANCY,
    terminated: LETTING_STATUS_TERMINATED,
  }

  static statusStringToValMap = {
    online: STATUS_ACTIVE,
    offline: STATUS_DRAFT,
    expired: STATUS_EXPIRE,
  }

  static floorDirectionStringToValMap = {
    na: ESTATE_FLOOR_DIRECTION_NA,
    left: ESTATE_FLOOR_DIRECTION_LEFT,
    right: ESTATE_FLOOR_DIRECTION_RIGHT,
    straight: ESTATE_FLOOR_DIRECTION_STRAIGHT,
    straight_left: ESTATE_FLOOR_DIRECTION_STRAIGHT_LEFT,
    straight_right: ESTATE_FLOOR_DIRECTION_STRAIGHT_RIGHT,
  }

  static propertyTypeStringToValMap = {
    apartment: PROPERTY_TYPE_APARTMENT,
    room: PROPERTY_TYPE_ROOM,
    house: PROPERTY_TYPE_HOUSE,
    site: PROPERTY_TYPE_SITE,
    office: PROPERTY_TYPE_OFFICE,
  }
  static possibleStringParams = [
    'address',
    'customArea',
    'customFloor',
    'property_id',
    'customRent',
    'customNumFloor',
    'rooms_number',
    'customUpdatedAt',
  ]
  globalSearchFields = ['property_id', 'address', 'six_char_code']

  constructor(params, query) {
    super(params, query)
    if (isEmpty(params)) {
      return
    }
    this.processGlobals()
    Filter.paramToField = {
      customArea: 'area',
      customFloor: 'floor',
      customNumFloor: 'number_floors',
      customRent: 'net_rent',
      customUpdatedAt: 'updated_at',
    }

    this.matchFilter(EstateFilters.possibleStringParams, params)

    /* address, area, property_id, net_rent */
    /* filter for combined letting_status and letting_type */
    if (params.customLettingStatus && params.customLettingStatus.value) {
      this.query.andWhere(function () {
        params.customLettingStatus.value.map((letting) => {
          const letting_str = EstateFilters.parseLetting(letting)
          const { letting_type, letting_status } = EstateFilters.lettingToIntVal(letting_str)
          this.orWhere(function () {
            if (letting_type) {
              this.andWhere('letting_type', letting_type)
            }
            if (letting_status) {
              this.andWhere('letting_status', letting_status)
            }
          })
        })
      })
    }
    /* filter for verified or not verified */
    if (
      params.verified_address &&
      params.verified_address.value &&
      Array.isArray(params.verified_address.value) &&
      params.verified_address.value.length &&
      !params.verified_address.value.includes(ESTATE_ALL_ADDRESS_LABEL)
    ) {
      this.query.where(function () {
        if (params.verified_address.value.includes(ESTATE_VALID_ADDRESS_LABEL)) {
          this.orWhere(Database.raw(`coord_raw is not null`))
        }
        if (params.verified_address.value.includes(ESTATE_INVALID_ADDRESS_LABEL)) {
          this.orWhere(Database.raw(`coord_raw is null`))
        }
      })
    }
    /* query */
    if (params.query) {
      this.query.where(function () {
        this.orWhere('estates.street', 'ilike', `%${params.query}%`)
        this.orWhere('estates.property_id', 'ilike', `${params.query}%`)
        this.orWhere('estates.city', 'ilike', `${params.query}%`)
        this.orWhere('estates.address', 'ilike', `${params.query}%`)
        this.orWhere('estates.country', 'ilike', `${params.query}%`)
        this.orWhere('estates.zip', 'ilike', `${params.query}%`)
      })
    }
    /* status */
    if (params.customStatus && params.customStatus.value) {
      let statuses = EstateFilters.customStatusesToValue(params.customStatus.value)
      this.query.whereIn('estates.status', statuses)
    }

    /* floor direction */
    if (params.floor_direction && params.floor_direction.value) {
      let floor_directions = EstateFilters.customFloorDirectionToValue(params.floor_direction.value)
      this.query.whereIn('estates.floor_direction', floor_directions)
    }

    /* property_type */
    if (params.customPropertyType && params.customPropertyType.value) {
      let propertyTypes = EstateFilters.customPropertyTypesToValue(params.customPropertyType.value)
      this.query.whereIn('estates.property_type', propertyTypes)
    }

    if (params.property_type) {
      this.query.whereIn(
        'estates.property_type',
        isArray(params.property_type) ? params.property_type : [params.property_type]
      )
    }
    /* letting_type */
    if (params.letting_type) {
      this.query.whereIn('estates.letting_type', params.letting_type)
    }
    /* letting_status */
    if (params.letting_status) {
      this.query.whereIn('estates.letting_status', params.letting_status)
    }
    /* this should be changed to match_status */
    if (params.filter && params.filter.length) {
      this.query.whereHas('matches', (query) => {
        query.whereIn('status', params.filter)
      })
    }

    if (params.is_expired_no_match_exclude) {
      this.query.where(function () {
        this.orWhere(function () {
          this.where('estates.status', STATUS_EXPIRE)
          this.whereHas('matches', (query) => {
            query.whereNotIn('status', [MATCH_STATUS_NEW])
          })
        })
        this.orWhere('estates.status', STATUS_ACTIVE)
      })
    } else {
      if (params.status) {
        this.query.whereIn(
          'estates.status',
          isArray(params.status) ? params.status : [params.status]
        )
      }
    }
  }

  static parseLetting(letting) {
    let letting_type
    let letting_status
    let matches
    if ((matches = letting.match(/^(.*?)-(.*?)$/))) {
      letting_type = toLower(trim(matches[1])).replace(/\./g, '').replace(/ /g, '_')
      letting_status = toLower(trim(matches[2])).replace(/\./g, '').replace(/ /g, '_')
    } else {
      letting_type = toLower(trim(letting)).replace(/\./g, '').replace(/ /g, '_')
      letting_status = null
    }
    return { letting_type, letting_status }
  }

  static lettingToIntVal({ letting_type, letting_status }) {
    letting_type = EstateFilters.lettingTypeString[letting_type]
    letting_status = letting_status ? EstateFilters.lettingStatusString[letting_status] : null
    return { letting_type, letting_status }
  }

  static customStatusesToValue(statuses) {
    return statuses.reduce(
      (statuses, status) => [...statuses, EstateFilters.statusStringToValMap[toLower(status)]],
      []
    )
  }

  static customFloorDirectionToValue(directions) {
    return directions.reduce(
      (directions, direction) => [
        ...directions,
        EstateFilters.floorDirectionStringToValMap[toLower(direction.replace(/\./g, ''))],
      ],
      []
    )
  }

  static customPropertyTypesToValue(propertyTypes) {
    return propertyTypes.reduce(
      (propertyTypes, propertyType) => [
        ...propertyTypes,
        EstateFilters.propertyTypeStringToValMap[toLower(propertyType)],
      ],
      []
    )
  }

  static paramsAreUsed(params) {
    let returns = EstateFilters.possibleStringParams.map((param) =>
      params[param] && params[param].operator ? true : false
    )
    if (includes(returns, true)) {
      return true
    }
    returns = ['customLettingStatus', 'verified_address', 'customStatus', 'customPropertyType'].map(
      (param) => (params[param] && params[param].value ? true : false)
    )
    if (includes(returns, true)) {
      return true
    }
    return false
  }
}

module.exports = EstateFilters
