const { isEmpty, trim } = require('lodash')
const Filter = require('./Filter')
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
} = require('../constants')

class TaskFilters extends Filter {
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
      address: 'estates',
      city: 'estates',
      urgency: 'tasks',
      status: 'tasks',
    }

    this.matchFilter(['address', 'city', 'urgency', 'status'], params)

    if (params.search_txt && trim(params.search_txt) !== '') {
      query.andWhere(function (sq) {
        sq.orWhere('_ect.email', 'ilike', `%${params.search_txt}%`)
        sq.orWhere('estates.property_id', 'ilike', `%${params.search_txt}%`)
        sq.orWhere('estates.address', 'ilike', `%${params.search_txt}%`)
      })
    }
  }
}

module.exports = TaskFilters
