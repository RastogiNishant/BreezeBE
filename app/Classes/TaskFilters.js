const { toLower, isArray, isEmpty, trim, isNull, includes, isBoolean } = require('lodash')
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
  TASK_STATUS_CLOSED
} = require('../constants')

class TaskFilters extends Filter{
  constructor(params, query) {
    super(params, query)

    Filter.MappingInfo = {
      urgency: {
        low: URGENCY_LOW,
        normal: URGENCY_NORMAL,
        high: URGENCY_HIGH,
        super: URGENCY_SUPER
      },
      status: {
        new: TASK_STATUS_NEW,
        inprogress:TASK_STATUS_INPROGRESS,
        resolved: TASK_STATUS_RESOLVED,
        unresolved: TASK_STATUS_UNRESOLVED,
        closed: TASK_STATUS_CLOSED
      }
    }
    Filter.TableInfo = {
      address: 'estates',
      city: 'estates',
      urgency: 'tasks',
      tenant_id: 'tasks',
      status: 'tasks'
    }

    this.matchFilter(['address','city', 'urgency', 'tenant_id', 'status'], params )
  }
}

module.exports = TaskFilters