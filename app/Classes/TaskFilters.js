const { isEmpty, trim, lowerCase } = require('lodash')
const Filter = require('./Filter')
const Database = use('Database')
const moment = require('moment')

const {
  URGENCY_LOW,
  URGENCY_NORMAL,
  URGENCY_HIGH,
  URGENCY_SUPER,
  TASK_STATUS_NEW,
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_UNRESOLVED,
  TASK_STATUS_RESOLVED,
  TASK_STATUS_CLOSED,
  INSIDE_BREEZE_LABEL,
  OUTSIDE_BREEZE_LABEL,
} = require('../constants')

class TaskFilters extends Filter {
  globalSearchFields = ['_ect.email', 'estates.property_id', 'estates.address', '_ect.phone_number']
  constructor(params, query) {
    super(params, query)

    if (isEmpty(params)) {
      return
    }

    this.processGlobals()

    Filter.MappingInfo = {
      urgency: {
        low: URGENCY_LOW,
        normal: URGENCY_NORMAL,
        high: URGENCY_HIGH,
        super: URGENCY_SUPER,
      },
      status: {
        new: TASK_STATUS_NEW,
        inprogress: TASK_STATUS_INPROGRESS,
        resolved: TASK_STATUS_RESOLVED,
        unresolved: TASK_STATUS_UNRESOLVED,
        closed: TASK_STATUS_CLOSED,
      },
    }
    Filter.TableInfo = {
      property_id: 'estates',
      address: 'estates',
      city: 'estates',
      urgency: 'tasks',
      status: 'tasks',
      email: '_ect',
      phone_number: '_ect',
    }

    Filter.paramToField = {
      active_task: 'count(tasks.id)',
    }

    this.matchFilter(
      [
        'property_id',
        'address',
        'city',
        'urgency',
        'email',
        'phone_number',
        'status',
        'contract_end',
      ],
      params
    )

    if (params.tenant_id) {
      this.query.whereIn('_ect.user_id', params.tenant_id)
    }

    if (params.breeze_type && params.breeze_type.value) {
      this.query.andWhere(function () {
        if (params.breeze_type.value.includes(INSIDE_BREEZE_LABEL))
          this.query.orWhere(Database.raw('_ect.user_id IS NOT NULL'))
        if (params.breeze_type.value.includes(OUTSIDE_BREEZE_LABEL))
          this.query.orWhere(Database.raw('_ect.user_id IS NULL'))
      })
    }

    if (params && params['active_task']) {
      this.query.whereIn('tasks.status', [TASK_STATUS_NEW, TASK_STATUS_INPROGRESS])
    }
  }

  afterQuery() {
    this.matchCountFilter(['active_task'], this.params)
    return this.query
  }
}

module.exports = TaskFilters
