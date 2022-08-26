const { isEmpty, without } = require('lodash')
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
  IS_INSIDE_BREEZE,
  IS_OUTSIDE_BREEZE,
  FILTER_NAME_CONNECT
} = require('../constants')

class TaskFilters extends Filter {

  constructor(params, query, user_id) {
    super(params, query, user_id, FILTER_NAME_CONNECT)

    if (isEmpty(params)) {
      return
    }
  }

  async init() {
    await super.init()

    const params = this.params

    Filter.MappingInfo = {
      urgency: {
        low: URGENCY_LOW,
        normal: URGENCY_NORMAL,
        high: URGENCY_HIGH,
        urgent: URGENCY_SUPER,
      },
      status: {
        new: TASK_STATUS_NEW,
        inprogress: TASK_STATUS_INPROGRESS,
        resolved: TASK_STATUS_RESOLVED,
        unresolved: TASK_STATUS_UNRESOLVED,
        closed: TASK_STATUS_CLOSED,
      },
    }

    this.paramToField = {
      active_task: 'count(tasks.id)',
      tenant: ['firstname', 'secondname', 'surname'],
    }

    this.matchFilters = without(this.matchFilters, 'active_task')

    //this.matchFilter(this.matchFilters, params)

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
        'tenant',
      ],
      params
    )

    this.processGlobals()

    if (
      params.breeze_type && this.isExist('breeze_type') &&
      [IS_INSIDE_BREEZE, IS_OUTSIDE_BREEZE].includes(params.breeze_type.value)
    ) {
      this.query.andWhere(function () {
        if (params.breeze_type.value) this.query.orWhere(Database.raw('_ect.user_id IS NOT NULL'))
        if (params.breeze_type.value === false)
          this.query.orWhere(Database.raw('_ect.user_id IS NULL'))
      })
    }

    const active_task_params = params['active_task']
    if (active_task_params && this.isExist('active_task') && active_task_params.constraints.length) {
      const values = active_task_params.constraints.filter(
        (c) => c.value !== null && c.value !== undefined
      )

      if (values.length) {
        this.query.whereIn('tasks.status', [TASK_STATUS_NEW, TASK_STATUS_INPROGRESS])
      }
    }
  }

  afterQuery() {
    // const matchCountFilterFields = this.isExist('active_task') ? ['active_task'] : []
    // this.matchCountFilter(matchCountFilterFields, this.params)
    return this.query
  }
}

module.exports = TaskFilters
