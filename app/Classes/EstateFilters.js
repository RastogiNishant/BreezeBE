const { toLower, isArray, isEmpty, trim, includes, isBoolean } = require('lodash')
const Database = use('Database')
const {
  LETTING_TYPE_LET,
  LETTING_TYPE_VOID,
  LETTING_TYPE_NA,
  LETTING_STATUS_CONSTRUCTION_WORKS,
  LETTING_STATUS_FIRST_TIME_USE,
  LETTING_STATUS_STRUCTURAL_VACANCY,
  LETTING_STATUS_DEFECTED,
  LETTING_STATUS_NORMAL,
  LETTING_STATUS_VACANCY,
  LETTING_STATUS_TERMINATED,
  STATUS_ACTIVE,
  STATUS_DRAFT,
  STATUS_EXPIRE,
  PROPERTY_TYPE_APARTMENT,
  PROPERTY_TYPE_ROOM,
  PROPERTY_TYPE_HOUSE,
  PROPERTY_TYPE_SITE,
} = require('../constants')
const Filter = require('./Filter')

class EstateFilters extends Filter {
  static lettingTypeString = {
    let: LETTING_TYPE_LET,
    void: LETTING_TYPE_VOID,
    na: LETTING_TYPE_NA,
  }
  static lettingStatusString = {
    construction_works: LETTING_STATUS_CONSTRUCTION_WORKS,
    first_time_use: LETTING_STATUS_FIRST_TIME_USE,
    structural_vacancy: LETTING_STATUS_STRUCTURAL_VACANCY,
    defected: LETTING_STATUS_DEFECTED,
    normal: LETTING_STATUS_NORMAL,
    vacancy: LETTING_STATUS_VACANCY,
    terminated: LETTING_STATUS_TERMINATED,
  }

  static statusStringToValMap = {
    online: STATUS_ACTIVE,
    offline: STATUS_DRAFT,
    expired: STATUS_EXPIRE,
  }
  static propertyTypeStringToValMap = {
    apartment: PROPERTY_TYPE_APARTMENT,
    room: PROPERTY_TYPE_ROOM,
    house: PROPERTY_TYPE_HOUSE,
    site: PROPERTY_TYPE_SITE,
  }
  static possibleStringParams = [
    'address',
    'customArea',
    'customFloor',
    'property_id',
    'customRent',
    'customNumFloor',
    'rooms_number',
  ]

  constructor(params, query) {
    super(params, query)

    if (isEmpty(params)) {
      return
    }

    Filter.paramToField = {
      customArea: 'area',
      customFloor: 'floor',
      customNumFloor: 'number_floors',
      customRent: 'net_rent',
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
    if (params.verified_address && isBoolean(params.verified_address.value)) {
      query.andWhere(
        Database.raw(EstateFilters.whereQueryForVerifiedAddress(params.verified_address.value))
      )
    }
    /* query */
    if (params.query) {
      this.query.where(function () {
        this.orWhere('estates.street', 'ilike', `%${params.query}%`)
        this.orWhere('estates.property_id', 'ilike', `${params.query}%`)
        this.orWhere('estates.city', 'ilike', `${params.query}%`)
      })
    }
    /* status */
    if (params.customStatus && params.customStatus.value) {
      let statuses = EstateFilters.customStatusesToValue(params.customStatus.value)
      this.query.whereIn('estates.status', statuses)
    }

    if (params.status) {
      this.query.whereIn('estates.status', isArray(params.status) ? params.status : [params.status])
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
    /* this should be changed to match_status */
    if (params.filter) {
      this.query.whereHas('matches', (query) => {
        query.whereIn('status', params.filter)
      })
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

  static whereQueryForVerifiedAddress(value) {
    return value ? `coord_raw is not null` : `coord_raw is null`
  }

  static customStatusesToValue(statuses) {
    return statuses.reduce(
      (statuses, status) => [...statuses, EstateFilters.statusStringToValMap[toLower(status)]],
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
