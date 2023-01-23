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
} = require('../constants')

class UpdateTenant extends Base {
  static schema = () =>
    yup.object().shape({
      private_use: yup.boolean(),
      pets: yup.number().integer().oneOf([PETS_NO, PETS_SMALL, PETS_ANY, PETS_BIG]).nullable(),
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
      budget_min: yup.number().min(0).max(100),
      budget_max: yup.number().min(0).max(100),
      include_utility: yup.boolean(),
      rooms_min: yup.number().positive().max(6),
      rooms_max: yup.number().positive().max(6),
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
            ])
        ),
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
              HOUSE_TYPE_GARDENHOUSE,
            ])
        )
        .nullable(),

      garden: yup.boolean(),
      options: yup.array().of(yup.number().integer().positive().max(999)),
      rent_start: yup.date(),
      transfer_budget_min: yup.number().integer().positive().min(0).max(2500).nullable(),
      transfer_budget_max: yup.number().integer().positive().min(0).max(500_000).nullable(),
      residency_duration: yup.number().integer().nullable().min(0).max(36).nullable(),
    })
}

module.exports = UpdateTenant
