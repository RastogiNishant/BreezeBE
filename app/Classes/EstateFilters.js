const { toLower, isArray, isEmpty, trim, isNull } = require('lodash')
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
} = require('../constants')

class EstateFilters {
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
  static paramToField = {
    customArea: 'area',
    customFloor: 'floor',
    customNumFloor: 'number_floors',
    customRent: 'net_rent',
  }
  static statusStringToValMap = {
    online: STATUS_ACTIVE,
    offline: STATUS_DRAFT,
    expired: STATUS_EXPIRE,
  }
  possibleStringParams = [
    'address',
    'customArea',
    'customFloor',
    'property_id',
    'customRent',
    'customNumFloor',
    'rooms_number',
  ]

  constructor(params, query) {
    if (isEmpty(params)) {
      this.query = query
      return
    }
    /* address, area, property_id, net_rent */
    this.possibleStringParams.forEach((param) => {
      if (params[param]) {
        if (params[param].operator && params[param].constraints.length > 0) {
          query.andWhere(function () {
            if (toLower(params[param].operator) === 'or') {
              params[param].constraints.map((constraint) => {
                if (!isNull(constraint.value)) {
                  this.orWhere(
                    Database.raw(
                      EstateFilters.parseMatchMode(
                        EstateFilters.mapParamToField(param),
                        constraint.value,
                        constraint.matchMode
                      )
                    )
                  )
                }
              })
            } else if (toLower(params[param].operator) === 'and') {
              params[param].constraints.map((constraint) => {
                if (!isNull(constraint.value)) {
                  this.andWhere(
                    Database.raw(
                      EstateFilters.parseMatchMode(
                        EstateFilters.mapParamToField(param),
                        constraint.value,
                        constraint.matchMode
                      )
                    )
                  )
                }
              })
            }
          })
        }
      }
    })
    /* filter for combined letting_status and letting_type */
    if (params.customLettingStatus && !isNull(params.customLettingStatus.value)) {
      query.andWhere(function () {
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
    if (params.verified_address && !isNull(params.verified_address.value)) {
      query.andWhere(
        Database.raw(EstateFilters.whereQueryForVerifiedAddress(params.verified_address.value))
      )
    }
    /* query */
    if (params.query) {
      query.where(function () {
        this.orWhere('estates.street', 'ilike', `%${params.query}%`)
        this.orWhere('estates.property_id', 'ilike', `${params.query}%`)
        this.orWhere('estates.city', 'ilike', `${params.query}%`)
      })
    }
    /* status */
    if (params.customStatus && !isNull(params.customStatus.value)) {
      let statuses = EstateFilters.customStatusesToValue(params.customStatus.value)
      query.whereIn('estates.status', statuses)
    }

    if (params.status) {
      query.whereIn('estates.status', isArray(params.status) ? params.status : [params.status])
    }
    /* property_type */
    if (params.property_type) {
      query.whereIn(
        'estates.property_type',
        isArray(params.property_type) ? params.property_type : [params.property_type]
      )
    }
    /* letting_type */
    if (params.letting_type) {
      query.whereIn('estates.letting_type', params.letting_type)
    }
    /* this should be changed to match_status */
    if (params.filter) {
      query.whereHas('matches', (query) => {
        query.whereIn('status', params.filter)
      })
    }

    this.query = query
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

  static parseMatchMode(param, value, matchMode) {
    switch (matchMode) {
      case 'startsWith':
        return `${param} ilike '${value}%'`
      case 'contains':
        return `${param} ilike '%${value}%'`
      case 'notContains':
        return `${param} not ilike '%${value}%'`
      case 'endsWith':
        return `${param} ilike '%${value}'`
      case 'equals':
        return `${param} = '${value}'`
      case 'notEquals':
        return `${param} <> '${value}'`
      case 'lt':
        return `${param} < '${value}'`
      case 'lte':
        return `${param} <= '${value}'`
      case 'gt':
        return `${param} > '${value}'`
      case 'gte':
        return `${param} >= '${value}'`
    }
    return false
  }
  /**
   * map param to database field
   *
   * @memberof EstateFilters
   */
  static mapParamToField(param) {
    return EstateFilters.paramToField[param] || param
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

  process() {
    return this.query
  }
}

module.exports = EstateFilters
