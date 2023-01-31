'use strict'
const { isEmpty } = require('lodash')
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
  MATCH_HOUSEHOLD_HAS_CHILD_LABEL,
  LOW_MATCH_ICON,
  MEDIUM_MATCH_ICON,
  SUPER_MATCH_ICON,
  DOC_INCOME_PROOF_LABEL,
  DOC_RENT_ARREARS_LABEL,
  DOC_CREDIT_SCORE_LABEL,
  STATUS_DELETE,
} = require('../constants')
const Filter = require('./Filter')
const Database = use('Database')

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
      income_sources: {
        employee: INCOME_TYPE_EMPLOYEE,
        worker: INCOME_TYPE_WORKER,
        unemployed: INCOME_TYPE_UNEMPLOYED,
        civil_servant: INCOME_TYPE_CIVIL_SERVANT,
        freelancer: INCOME_TYPE_FREELANCER,
        housekeeper: INCOME_TYPE_HOUSE_WORK,
        pensioner: INCOME_TYPE_PENSIONER,
        self_employeed: INCOME_TYPE_SELF_EMPLOYED,
        trainee: INCOME_TYPE_TRAINEE,
      },
    }

    Filter.TableInfo = {
      income: '_t',
      updated_at: 'matches',
      firstname: '_u',
      secondname: '_u',
      total_work_exp: '_me',
    }

    Filter.paramToField = {
      status: 'updated_at',
      tenant: ['firstname', 'secondname'],
      age: 'any(_m.members_age)',
      knocked_at: `to_char(knocked_at,'YYYY-MM-DD')`,
    }

    this.matchFilter(['income', 'status', 'tenant', 'age', 'total_work_exp', 'knocked_at'], params)

    if (params.knocked_at && params.knocked_at.constraints.length) {
      const values = params.knocked_at.constraints.filter(
        (c) => c.value !== null && c.value !== undefined
      )
      if (values && values.length) {
        this.query.whereNot('_u.status', STATUS_DELETE)
      }
    }

    if (params.percent && params.percent.value !== null) {
      this.query.andWhere(function () {
        if (params.percent.value.includes(LOW_MATCH_ICON)) {
          this.query.orWhere('matches.percent', '<=', 60)
        }
        if (params.percent.value.includes(MEDIUM_MATCH_ICON)) {
          this.query.orWhere(function () {
            this.query.andWhere('matches.percent', '>', 60).andWhere('matches.percent', '<=', 80)
          })
        }
        if (params.percent.value.includes(SUPER_MATCH_ICON)) {
          this.query.orWhere('matches.percent', '>', 80)
        }
      })
    }

    if (params.doc_type && params.doc_type.value !== null) {
      if (params.doc_type.value.includes(DOC_INCOME_PROOF_LABEL)) {
        this.query.andWhere('income_proofs', true)
      } else if (params.doc_type.value.includes(DOC_RENT_ARREARS_LABEL)) {
        this.query.andWhere('no_rent_arrears_proofs', true)
      } else if (params.doc_type.value.includes(DOC_CREDIT_SCORE_LABEL)) {
        this.query.andWhere('credit_score_proofs', true)
      }
    }

    if (params.income_sources && params.income_sources.value != null) {
      const income_sources = this.getValues('income_sources', params.income_sources.value)
      this.query.where(
        Database.raw(`_me.income_sources::jsonb \\?| array['${income_sources.join(',')}']`)
      )
    }

    if (params.has_child && params.has_child.value !== null) {
      this.query.andWhere(function () {
        if (params.has_child.value.includes(MATCH_HOUSEHOLD_HAS_CHILD_LABEL)) {
          this.query.andWhere('_t.minors_count', '>', 0)
        }
        if (params.has_child.value.includes(MEDIUM_MATCH_ICON)) {
          this.query.andWhere(function () {
            this.query.orWhereNull('_t.minors_count')
            this.query.orWhere('_t.minors_count', '=', 0)
          })
        }
      })
    }
  }
}

module.exports = MatchFilters
