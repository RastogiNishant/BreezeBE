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
  globalSearchFields = ['_ect.email', 'estates.property_id', 'estates.address']
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
      active_task: 'count(tasks)',
    }

    this.matchFilter(
      ['property_id', 'address', 'city', 'urgency', 'email', 'phone_number', 'status'],
      params
    )

    this.matchCountFilter([active_task], params)
  }
}

module.exports = TaskFilters
