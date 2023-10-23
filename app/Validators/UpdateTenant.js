'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  PETS_NO,
  PETS_SMALL,
  PETS_ANY,
  PETS_BIG,
  TRANSPORT_TYPE_CAR,
  TRANSPORT_TYPE_WALK,
  TRANSPORT_TYPE_SOCIAL,
  // Apt type
  APARTMENT_TYPE_FLAT,
  APARTMENT_TYPE_GROUND,
  APARTMENT_TYPE_ROOF,
  APARTMENT_TYPE_MAISONETTE,
  APARTMENT_TYPE_LOFT,
  APARTMENT_TYPE_SOCIAL,
  APARTMENT_TYPE_SOUTERRAIN,
  APARTMENT_TYPE_PENTHOUSE,
  APARTMENT_TYPE_TERRACES,
  APARTMENT_TYPE_HOLIDAY,
  APARTMENT_TYPE_GALLERY,
  APARTMENT_TYPE_ATTIC,

  // Building type
  HOUSE_TYPE_MULTIFAMILY_HOUSE,
  HOUSE_TYPE_HIGH_RISE,
  HOUSE_TYPE_SERIES,
  HOUSE_TYPE_SEMIDETACHED_HOUSE,
  HOUSE_TYPE_2FAMILY_HOUSE,
  HOUSE_TYPE_DETACHED_HOUSE,
  HOUSE_TYPE_COUNTRY,
  HOUSE_TYPE_BUNGALOW,
  HOUSE_TYPE_VILLA,
  HOUSE_TYPE_GARDENHOUSE,
  //Minor
  MAX_MINOR_COUNT,
  MAX_ROOM_COUNT,
  CERT_CATEGORY_A,
  CERT_CATEGORY_B,
  CERT_CATEGORY_C,
  CERT_CATEGORY_NOT,
  CERT_CATEGORY_I,
  CERT_CATEGORY_II,
  CERT_CATEGORY_III,
  CERT_CATEGORY_IV,
  CERT_CATEGORY_100,
  CERT_CATEGORY_140,
  CERT_CATEGORY_160,
  CERT_CATEGORY_180,
  CERT_CATEGORY_220
} = require('../constants')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, OPTION, INVALID_IDS, SIZE, NUMBER, SHOULD_BE_AFTER }
} = require('../exceptions')

class UpdateTenant extends Base {
  static schema = () =>
    yup.object().shape({
      private_use: yup.boolean(),
      mixed_use_type_detail: yup.string().nullable(),
      pets: yup.number().integer().oneOf([PETS_NO, PETS_SMALL, PETS_ANY]).nullable(),
      pets_species: yup.string().max(255).nullable(),
      non_smoker: yup.boolean(),
      parking_space: yup.number().min(0),
      minors_count: yup.number().min(0).max(MAX_MINOR_COUNT),
      coord: yup.string().matches(/^(-)?\d{1,3}\.\d{5,8}\,(-)?\d{1,3}\.\d{5,8}$/),
      address: yup
        .string()
        .max(255)
        .when('coord', (coord, schema) => {
          return coord ? yup.string().required() : schema
        }),
      dist_type: yup
        .string()
        .oneOf([TRANSPORT_TYPE_CAR, TRANSPORT_TYPE_WALK, TRANSPORT_TYPE_SOCIAL]),
      dist_min: yup.number().integer().oneOf([15, 30, 45, 60]),
      budget_min: yup.number().integer().min(0),
      budget_max: yup.number().integer().min(0),
      include_utility: yup.boolean(),
      rooms_min: yup.number().positive().max(MAX_ROOM_COUNT),
      rooms_max: yup.number().positive().max(MAX_ROOM_COUNT),
      floor_min: yup.number().min(0).max(21),
      floor_max: yup.number().min(0).max(21),
      space_min: yup.number().min(5).max(500),
      space_max: yup.number().min(5).max(500),
      apt_type: yup
        .array()
        .of(
          yup
            .number()
            .positive()
            .oneOf([
              APARTMENT_TYPE_FLAT,
              APARTMENT_TYPE_GROUND,
              APARTMENT_TYPE_ROOF,
              APARTMENT_TYPE_MAISONETTE,
              APARTMENT_TYPE_LOFT,
              APARTMENT_TYPE_SOCIAL,
              APARTMENT_TYPE_SOUTERRAIN,
              APARTMENT_TYPE_PENTHOUSE,
              APARTMENT_TYPE_TERRACES,
              APARTMENT_TYPE_HOLIDAY,
              APARTMENT_TYPE_GALLERY,
              APARTMENT_TYPE_ATTIC
            ])
        )
        .nullable(),
      house_type: yup
        .array()
        .of(
          yup
            .number()
            .positive()
            .oneOf([
              HOUSE_TYPE_MULTIFAMILY_HOUSE,
              HOUSE_TYPE_HIGH_RISE,
              HOUSE_TYPE_SERIES,
              HOUSE_TYPE_SEMIDETACHED_HOUSE,
              HOUSE_TYPE_2FAMILY_HOUSE,
              HOUSE_TYPE_DETACHED_HOUSE,
              HOUSE_TYPE_COUNTRY,
              HOUSE_TYPE_BUNGALOW,
              HOUSE_TYPE_VILLA,
              HOUSE_TYPE_GARDENHOUSE
            ])
        )
        .nullable(),

      garden: yup.boolean(),
      options: yup.array().of(yup.number().integer().positive().max(999)).nullable(),
      rent_start: yup.date(),
      transfer_budget_min: yup.number().integer().positive().min(0).max(500000).nullable(),
      transfer_budget_max: yup.number().integer().positive().min(0).max(500000).nullable(),
      is_short_term_rent: yup.boolean(),
      residency_duration_min: yup
        .number()
        .integer()
        .when(['is_short_term_rent'], (is_short_term_rent) => {
          if (is_short_term_rent) {
            return yup.number().integer().min(1).required()
          }
          return yup.number().integer().min(1).nullable()
        }),
      residency_duration_max: yup
        .number()
        .integer()
        .when(['residency_duration_min'], (residency_duration_min, schema, { value }) => {
          if (!residency_duration_min) return schema
          return value && value <= residency_duration_min
            ? yup
                .number()
                .integer()
                .min(
                  available_start_at,
                  getExceptionMessage(
                    'residency_duration_max',
                    SHOULD_BE_AFTER,
                    residency_duration_min
                  )
                )
            : schema
        })
        .nullable(),
      selected_adults_count: yup.number().integer(),
      income_level: yup
        .array()
        .of(
          yup
            .string()
            .oneOf([
              CERT_CATEGORY_A,
              CERT_CATEGORY_B,
              CERT_CATEGORY_C,
              CERT_CATEGORY_I,
              CERT_CATEGORY_II,
              CERT_CATEGORY_III,
              CERT_CATEGORY_IV,
              CERT_CATEGORY_100,
              CERT_CATEGORY_140,
              CERT_CATEGORY_160,
              CERT_CATEGORY_180,
              CERT_CATEGORY_220,
              CERT_CATEGORY_NOT
            ])
        )
        .nullable(),
      is_public_certificate: yup.boolean().nullable(),
      only_count: yup.boolean().nullable()
    })
}

module.exports = UpdateTenant
