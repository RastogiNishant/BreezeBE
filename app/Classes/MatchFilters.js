'user strict'

const {
  INCOME_TYPE_EMPLOYEE,
  INCOME_TYPE_WORKER,
  INCOME_TYPE_UNEMPLOYED,
  INCOME_TYPE_CIVIL_SERVANT,
  INCOME_TYPE_FREELANCER,
  INCOME_TYPE_HOUSE_WORK,
  INCOME_TYPE_PENSIONER,
  INCOME_TYPE_SELF_EMPLOYED,
  INCOME_TYPE_TRAINEE,
} = require('../constants')
const Filter = require('./Filter')

class MatchFilters extends Filter {
  // static HouseHoldMap = {
  //   has_child:
  // }

  static possibleStringParams = ['income', 'income_sources']

  constructor(params, query) {
    super(params, query)
    if (isEmpty(params)) {
      return
    }

    Filter.MappingInfo = {
      urgency: {
        low: URGENCY_LOW,
        normal: URGENCY_NORMAL,
        high: URGENCY_HIGH,
        urgent: URGENCY_SUPER,
      },
      income_sources: {
        employee: INCOME_TYPE_EMPLOYEE,
        worker: INCOME_TYPE_WORKER,
        unemployed: INCOME_TYPE_UNEMPLOYED,
        civil_servant: INCOME_TYPE_CIVIL_SERVANT,
        freelance: INCOME_TYPE_FREELANCER,
        housekeeper: INCOME_TYPE_HOUSE_WORK,
        pensioner: INCOME_TYPE_PENSIONER,
        self_employeed: INCOME_TYPE_SELF_EMPLOYED,
        trainee: INCOME_TYPE_TRAINEE,
      },
    }

    Filter.TableInfo = {
      income_sources: '_i',
      income: '_t',
      updated_at: 'matches',
      firstname: '_u',
      secondname: '_u',
    }

    Filter.paramToField = {
      status: 'updated_at',
      tenant: ['firstname', 'secondname'],
    }

    this.matchFilter(['income', 'income_sources', 'status', 'tenant'], params)
  }
}

module.exports = MatchFilters
