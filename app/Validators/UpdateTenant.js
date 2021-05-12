'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  PETS_NO,
  PETS_SMALL,
  PEST_ANY,
  TRANSPORT_TYPE_CAR,
  TRANSPORT_TYPE_WALK,
  TRANSPORT_TYPE_SOCIAL,
  // Apt type
  APARTMENT_TYPE_LOFT_STUDIO_ATELIER,
  APARTMENT_TYPE_PENTHOUSE,
  APARTMENT_TYPE_TERRACES,
  APARTMENT_TYPE_FLOOR,
  APARTMENT_TYPE_GROUND_FLOOR,
  APARTMENT_TYPE_SOUTERRAIN,
  APARTMENT_TYPE_APARTMENT,
  APARTMENT_TYPE_HOLIDAY_APARTMENT,
  APARTMENT_TYPE_GALLERY,
  APARTMENT_TYPE_ROOF_FLOOR,
  APARTMENT_TYPE_ATTIKA_APARTMENT,
  APARTMENT_TYPE_NO_ADDRESS,
  APARTMENT_TYPE_MAISONETTE,
  APARTMENT_TYPE_SOCIAL,
  // Building type
  HOUSE_TYPE_REIHENHAUS,
  HOUSE_TYPE_REIHEND,
  HOUSE_TYPE_REIHENMITTEL,
  HOUSE_TYPE_REIHENECK,
  HOUSE_TYPE_SEMI_DETACHED_HOUSE,
  HOUSE_TYPE_DETACHED_HOUSE,
  HOUSE_TYPE_CITY_HOUSE,
  HOUSE_TYPE_BUNGALOW,
  HOUSE_TYPE_VILLA,
  HOUSE_TYPE_RESTHOF,
  HOUSE_TYPE_BUILDERS_HOUSE,
  HOUSE_TYPE_COUNTRY_HOUSE,
  HOUSE_TYPE_CASTLE,
  HOUSE_TYPE_TWO_FAMILY_HOUSE,
  HOUSE_TYPE_MULTI_FAMILY_HOUSE,
  HOUSE_TYPE_HOLIDAY_HOUSE,
  HOUSE_TYPE_MOUNTAIN_HOUSE,
  HOUSE_TYPE_CHALET,
  HOUSE_TYPE_BEACH_HOUSE,
  HOUSE_TYPE_LAUBE_DATSCHE_GARDENHOUSE,
  HOUSE_TYPE_APARTMENT_HOUSE,
  HOUSE_TYPE_LORDS_HOUSE,
  HOUSE_TYPE_FINCA,
  HOUSE_TYPE_RUSTICO,
  HOUSE_TYPE_FINISHED_HOUSE,
  HOUSE_TYPE_NO_ADDRESS,
} = require('../constants')

class UpdateTenant extends Base {
  static schema = () =>
    yup.object().shape({
      private_use: yup.boolean(),
      pets: yup.number().integer().oneOf([PETS_NO, PETS_SMALL, PEST_ANY]).nullable(),
      pets_species: yup.string().max(255),
      parking_space: yup.number().min(0),
      coord: yup.string().matches(/^\d{1,3}\.\d{5,8}\,\d{1,3}\.\d{5,8}$/),
      dist_type: yup
        .string()
        .oneOf([TRANSPORT_TYPE_CAR, TRANSPORT_TYPE_WALK, TRANSPORT_TYPE_SOCIAL]),
      dist_min: yup.number().integer().oneOf([0, 15, 30, 45, 60]),
      budget_min: yup.number().positive().max(100),
      budget_max: yup.number().positive().max(100),
      include_utility: yup.boolean(),
      rooms_min: yup.number().positive().max(6),
      rooms_max: yup.number().positive().max(6),
      floor_min: yup.number().min(0).max(21),
      floor_max: yup.number().min(0).max(21),
      space_min: yup.number().min(5).max(300),
      space_max: yup.number().min(5).max(300),
      apt_type: yup.array()
        .of(
          yup
            .number()
            .positive()
            .oneOf([
              APARTMENT_TYPE_LOFT_STUDIO_ATELIER,
              APARTMENT_TYPE_PENTHOUSE,
              APARTMENT_TYPE_TERRACES,
              APARTMENT_TYPE_FLOOR,
              APARTMENT_TYPE_GROUND_FLOOR,
              APARTMENT_TYPE_SOUTERRAIN,
              APARTMENT_TYPE_APARTMENT,
              APARTMENT_TYPE_HOLIDAY_APARTMENT,
              APARTMENT_TYPE_GALLERY,
              APARTMENT_TYPE_ROOF_FLOOR,
              APARTMENT_TYPE_ATTIKA_APARTMENT,
              APARTMENT_TYPE_NO_ADDRESS,
              APARTMENT_TYPE_MAISONETTE,
              APARTMENT_TYPE_SOCIAL,
            ])
        )
        .nullable(),
      house_type: yup.array()
        .of(
          yup
            .number()
            .positive()
            .oneOf([
              HOUSE_TYPE_REIHENHAUS,
              HOUSE_TYPE_REIHEND,
              HOUSE_TYPE_REIHENMITTEL,
              HOUSE_TYPE_REIHENECK,
              HOUSE_TYPE_SEMI_DETACHED_HOUSE,
              HOUSE_TYPE_DETACHED_HOUSE,
              HOUSE_TYPE_CITY_HOUSE,
              HOUSE_TYPE_BUNGALOW,
              HOUSE_TYPE_VILLA,
              HOUSE_TYPE_RESTHOF,
              HOUSE_TYPE_BUILDERS_HOUSE,
              HOUSE_TYPE_COUNTRY_HOUSE,
              HOUSE_TYPE_CASTLE,
              HOUSE_TYPE_TWO_FAMILY_HOUSE,
              HOUSE_TYPE_MULTI_FAMILY_HOUSE,
              HOUSE_TYPE_HOLIDAY_HOUSE,
              HOUSE_TYPE_MOUNTAIN_HOUSE,
              HOUSE_TYPE_CHALET,
              HOUSE_TYPE_BEACH_HOUSE,
              HOUSE_TYPE_LAUBE_DATSCHE_GARDENHOUSE,
              HOUSE_TYPE_APARTMENT_HOUSE,
              HOUSE_TYPE_LORDS_HOUSE,
              HOUSE_TYPE_FINCA,
              HOUSE_TYPE_RUSTICO,
              HOUSE_TYPE_FINISHED_HOUSE,
              HOUSE_TYPE_NO_ADDRESS,
            ])
        )
        .nullable(),

      garden: yup.boolean(),
    })
}

module.exports = UpdateTenant
