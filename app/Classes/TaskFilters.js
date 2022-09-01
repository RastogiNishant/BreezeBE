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
  ALL_BREEZE,
  CONNECTED_BREEZE_TEANT_LABEL,
  NOT_CONNECTED_BREEZE_TEANT_LABEL,
  PENDING_BREEZE_TEANT_LABEL,
  DATE_FORMAT,
  STATUS_ACTIVE,
  TENANT_INVITATION_EXPIRATION_DATE,
} = require('../constants')

class TaskFilters extends Filter {
  globalSearchFields = [
    '_ect.email',
    'estates.property_id',
    'estates.address',
    '_ect.phone_number',
    '_ect.surname',
  ]
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
    Filter.TableInfo = {
      property_id: 'estates',
      address: 'estates',
      city: 'estates',
      urgency: 'tasks',
      status: 'tasks',
      email: '_ect',
      phone_number: '_ect',
      surname: '_ect',
      firstname: '_u',
      secondname: '_u',
    }

    Filter.paramToField = {
      active_task: 'count(tasks.id)',
      tenant: ['firstname', 'secondname', 'surname'],
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
        'tenant',
      ],
      params
    )

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
            (_ect.user_id IS NULL AND _ect.code IS NULL ) OR
            (_ect.code IS NOT NULL AND _ect.invite_sent_at < '${moment
              .utc(new Date())
              .subtract(TENANT_INVITATION_EXPIRATION_DATE, 'days')
              .format(DATE_FORMAT)}' )`)
          )
        }

        if (params.breeze_type.value.findIndex((v) => v === PENDING_BREEZE_TEANT_LABEL) !== -1) {
          this.query.orWhere(
            Database.raw(`
              _ect.code IS NOT NULL AND _ect.invite_sent_at >= '${moment
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
  }

  afterQuery() {
    this.matchCountFilter(['active_task'], this.params)
    return this.query
  }
}

module.exports = TaskFilters
