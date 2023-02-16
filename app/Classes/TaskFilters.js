const { isEmpty, without } = require('lodash')
const Filter = require('./Filter')
const Database = use('Database')

const {
  URGENCY_LOW,
  URGENCY_NORMAL,
  URGENCY_HIGH,
  URGENCY_SUPER,
  TASK_STATUS_NEW,
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_UNRESOLVED,
  TASK_STATUS_RESOLVED,
  ALL_BREEZE,
  CONNECTED_BREEZE_TEANT_LABEL,
  NOT_CONNECTED_BREEZE_TEANT_LABEL,
  PENDING_BREEZE_TEANT_LABEL,
  DATE_FORMAT,
  FILTER_NAME_CONNECT,
  STATUS_ACTIVE,
  TENANT_INVITATION_EXPIRATION_DATE,
} = require('../constants')

class TaskFilters extends Filter {
  constructor(params, query, user_id) {
    super(params, query, user_id, FILTER_NAME_CONNECT)
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
      },
    }

    Filter.paramToField = {
      ...Filter.paramToField,
      active_task: 'count(tasks.id)',
      in_progress_task: 'count(tasks.id)',
      tenant: ['surname'],
      task_name: ['title', 'description'],
    }
    this.matchFilters = without(this.matchFilters, 'active_task', 'in_progress_task', 'breeze_type')

    this.matchFilter(this.matchFilters, params)

    this.processGlobals()

    if (
      params.breeze_type &&
      params.breeze_type.value !== undefined &&
      params.breeze_type.value !== null &&
      !params.breeze_type.value.includes(ALL_BREEZE)
    ) {
      this.query.andWhere(function () {
        if (params.breeze_type.value.findIndex((v) => v === CONNECTED_BREEZE_TEANT_LABEL) !== -1) {
          this.query.orWhere(
            Database.raw(`_ect.user_id IS NOT NULL and _ect.status = ${STATUS_ACTIVE}`)
          )
        }

        if (
          params.breeze_type.value.findIndex((v) => v === NOT_CONNECTED_BREEZE_TEANT_LABEL) !== -1
        ) {
          this.query.orWhere(
            Database.raw(`
            _ect.user_id IS NULL AND
            ( _ect.code IS NULL OR
            (_ect.code IS NOT NULL AND _ect.invite_sent_at < '${moment
              .utc(new Date())
              .subtract(TENANT_INVITATION_EXPIRATION_DATE, 'days')
              .format(DATE_FORMAT)}') )`)
          )
        }

        if (params.breeze_type.value.findIndex((v) => v === PENDING_BREEZE_TEANT_LABEL) !== -1) {
          this.query.orWhere(
            Database.raw(`
            _ect.user_id IS NULL AND _ect.code IS NOT NULL AND _ect.invite_sent_at >= '${moment
              .utc(new Date())
              .subtract(TENANT_INVITATION_EXPIRATION_DATE, 'days')
              .format(DATE_FORMAT)}'`)
          )
        }
      })
    }

    const active_task_params = params['active_task']
    if (active_task_params && active_task_params.constraints.length) {
      const values = active_task_params.constraints.filter(
        (c) => c.value !== null && c.value !== undefined
      )

      if (values.length) {
        this.query.whereIn('tasks.status', [TASK_STATUS_NEW, TASK_STATUS_INPROGRESS])
      }
    }

    const in_progress_task_params = params['in_progress_task']
    if (in_progress_task_params && in_progress_task_params.constraints.length) {
      const values = in_progress_task_params.constraints.filter(
        (c) => c.value !== null && c.value !== undefined
      )

      if (values.length) {
        this.query.whereIn('tasks.status', [TASK_STATUS_INPROGRESS])
      }
    }
  }

  afterQuery() {
    const matchCountFilterFields = ['active_task', 'in_progress_task'].filter((column) =>
      this.isExist(column)
    )
    this.matchCountFilter(matchCountFilterFields, this.params)
    return this.query
  }
}

module.exports = TaskFilters
