'use strict'

const yup = require('yup')
const { isArray } = require('lodash')
const Base = require('./Base')

const {
  STATUS_ACTIVE,
  STATUS_DRAFT,
  STATUS_EXPIRE,
  LETTING_TYPE_LET,
  LETTING_TYPE_VOID,
  LETTING_TYPE_NA,
  PROPERTY_TYPE_APARTMENT,
  PROPERTY_TYPE_ROOM,
  PROPERTY_TYPE_HOUSE,
  PROPERTY_TYPE_SITE,
  FILTER_CONSTRAINTS_MATCH_MODES,
} = require('../constants')

class EstateFilter extends Base {
  static schema = () =>
    yup.object().shape({
      query: yup.string().min(2),
      filter: yup.array().of(yup.number()).nullable(),
      address: yup
        .object()
        .shape({
          operator: yup.string().oneOf(['and', 'or']),
          constraints: yup.array().of(
            yup.object().shape({
              matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_MATCH_MODES),
              value: yup.string().nullable(),
            })
          ),
        })
        .nullable(),
      customArea: yup
        .object()
        .shape({
          operator: yup.string().oneOf(['and', 'or']),
          constraints: yup.array().of(
            yup.object().shape({
              matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_MATCH_MODES),
              value: yup.number().nullable(),
            })
          ),
        })
        .nullable(),
      customFloor: yup
        .object()
        .shape({
          operator: yup.string().oneOf(['and', 'or']),
          constraints: yup.array().of(
            yup.object().shape({
              matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_MATCH_MODES),
              value: yup.number().nullable(),
            })
          ),
        })
        .nullable(),
      property_id: yup
        .object()
        .shape({
          operator: yup.string().oneOf(['and', 'or']),
          constraints: yup.array().of(
            yup.object().shape({
              matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_MATCH_MODES),
              value: yup.string().nullable(),
            })
          ),
        })
        .nullable(),
      customRent: yup
        .object()
        .shape({
          operator: yup.string().oneOf(['and', 'or']),
          constraints: yup.array().of(
            yup.object().shape({
              matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_MATCH_MODES),
              value: yup.string().nullable(),
            })
          ),
        })
        .nullable(),
      customNumFloor: yup
        .object()
        .shape({
          operator: yup.string().oneOf(['and', 'or']),
          constraints: yup.array().of(
            yup.object().shape({
              matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_MATCH_MODES),
              value: yup.string().nullable(),
            })
          ),
        })
        .nullable(),
      rooms_number: yup
        .object()
        .shape({
          operator: yup.string().oneOf(['and', 'or']),
          constraints: yup.array().of(
            yup.object().shape({
              matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_MATCH_MODES),
              value: yup.string().nullable(),
            })
          ),
        })
        .nullable(),
      status: yup.lazy((value) => {
        if (isArray(value)) {
          return yup
            .array()
            .of(yup.number().oneOf([STATUS_ACTIVE, STATUS_DRAFT, STATUS_EXPIRE]))
            .min(1)
        } else {
          return yup.number().oneOf([STATUS_ACTIVE, STATUS_DRAFT, STATUS_EXPIRE])
        }
      }),
      property_type: yup
        .array()
        .of(
          yup
            .number()
            .oneOf([
              PROPERTY_TYPE_APARTMENT,
              PROPERTY_TYPE_ROOM,
              PROPERTY_TYPE_HOUSE,
              PROPERTY_TYPE_SITE,
            ])
        ),
      letting_type: yup
        .array()
        .of(yup.number().oneOf([LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA])),
      letting: yup.array().of(yup.string()),
    })
}

module.exports = EstateFilter
