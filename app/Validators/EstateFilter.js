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
  PROPERTY_TYPE_APARTMENT,
  PROPERTY_TYPE_ROOM,
  PROPERTY_TYPE_HOUSE,
  PROPERTY_TYPE_SITE,
  PROPERTY_TYPE_OFFICE,
  FILTER_CONSTRAINTS_MATCH_MODES,
  LETTING_TYPE_NA,
  ESTATE_VALID_ADDRESS_LABEL,
  ESTATE_INVALID_ADDRESS_LABEL,
  ESTATE_ALL_ADDRESS_LABEL,
  MATCH_STATUS_KNOCK,
  MATCH_STATUS_INVITE,
  MATCH_STATUS_VISIT,
  MATCH_STATUS_SHARE,
  MATCH_STATUS_COMMIT,
  MATCH_STATUS_TOP,
  MATCH_STATUS_FINISH,
} = require('../constants')

class EstateFilter extends Base {
  static schema = () =>
    yup.object().shape({
      query: yup.string().min(2),
      filter: yup
        .array()
        .of(
          yup
            .number()
            .oneOf([
              MATCH_STATUS_KNOCK,
              MATCH_STATUS_INVITE,
              MATCH_STATUS_VISIT,
              MATCH_STATUS_SHARE,
              MATCH_STATUS_TOP,
              MATCH_STATUS_COMMIT,
              MATCH_STATUS_FINISH,
            ])
        )
        .nullable(),
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
      customLettingStatus: yup
        .object()
        .shape({
          matchMode: yup.string().nullable(),
          value: yup.array().of(yup.string()).nullable(),
        })
        .nullable(),
      verified_address: yup
        .object()
        .shape({
          matchMode: yup.string().nullable(),
          value: yup
            .array()
            .of(
              yup
                .string()
                .oneOf([
                  ESTATE_VALID_ADDRESS_LABEL,
                  ESTATE_INVALID_ADDRESS_LABEL,
                  ESTATE_ALL_ADDRESS_LABEL,
                ])
            )
            .nullable(),
        })
        .nullable(),
      customStatus: yup
        .object()
        .shape({
          matchMode: yup.string().nullable(),
          value: yup.array().of(yup.string()).nullable(),
        })
        .nullable(),
      customPropertyType: yup
        .object()
        .shape({
          matchMode: yup.string().nullable(),
          value: yup.array().of(yup.string()).nullable(),
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
              PROPERTY_TYPE_OFFICE,
            ])
        ),
      letting_type: yup
        .array()
        .of(yup.number().oneOf([LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA]).nullable()),
      letting: yup.array().of(yup.string()),
      floor_direction: yup
        .object()
        .shape({
          matchMode: yup.string().nullable(),
          value: yup.array().of(yup.string()).nullable(),
        })
        .nullable(),
    })
}

module.exports = EstateFilter
