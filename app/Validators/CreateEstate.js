'use strict'

const yup = require('yup')
const Base = require('./Base')
const PublishInfo = require('./PublishInfo')
const moment = require('moment')
const {
  STATUS_ACTIVE,
  STATUS_DELETE,
  STATUS_DRAFT,
  // property_type
  PROPERTY_TYPE_APARTMENT,
  PROPERTY_TYPE_ROOM,
  PROPERTY_TYPE_HOUSE,
  PROPERTY_TYPE_SITE,
  PROPERTY_TYPE_OFFICE,
  // type
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

  // House type
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

  // Occupation
  OCCUPATION_TYPE_OCCUPIED_OWN,
  OCCUPATION_TYPE_OCCUPIED_TENANT,
  OCCUPATION_TYPE_WRITE_OFF,
  OCCUPATION_TYPE_VACANCY,
  OCCUPATION_TYPE_NOT_RENT,
  OCCUPATION_TYPE_NOT_OCCUPIED,
  // user_type
  USE_TYPE_RESIDENTIAL,
  USE_TYPE_COMMERCIAL,
  USE_TYPE_CONSTRUCT,
  USE_TYPE_WAZ,
  USE_TYPE_PLANT,
  USE_TYPE_OTHER,

  // ownership_type
  OWNERSHIP_TYPE_FREEHOLDER,
  OWNERSHIP_TYPE_DIRECT_PROPERTY,
  OWNERSHIP_TYPE_LEASEHOLD,
  OWNERSHIP_TYPE_OTHER,
  // Marketing_type
  MARKETING_TYPE_PURCHASE,
  MARKETING_TYPE_RENT_LEASE,
  MARKETING_TYPE_LEASEHOLD,
  MARKETING_TYPE_LEASING,
  // Energy type
  ENERGY_TYPE_LOW_ENERGY,
  ENERGY_TYPE_PASSIVE_HOUSE,
  ENERGY_TYPE_NEW_BUILDING_STANDARD,
  ENERGY_TYPE_KFW40,
  ENERGY_TYPE_KFW60,
  ENERGY_TYPE_KFW55,
  ENERGY_TYPE_KFW70,
  ENERGY_TYPE_MINERGIE_CONSTRUCTION,
  ENERGY_TYPE_MINERGIE_CERTIFIED,
  // gender
  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_ANY,
  // parking space type
  PARKING_SPACE_TYPE_UNDERGROUND,
  PARKING_SPACE_TYPE_CARPORT,
  PARKING_SPACE_TYPE_OUTDOOR,
  PARKING_SPACE_TYPE_CAR_PARK,
  PARKING_SPACE_TYPE_DUPLEX,
  PARKING_SPACE_TYPE_GARAGE,
  // building status
  BUILDING_STATUS_FIRST_TIME_OCCUPIED,
  BUILDING_STATUS_PART_COMPLETE_RENOVATION_NEED,
  BUILDING_STATUS_NEW,
  BUILDING_STATUS_EXISTING,
  BUILDING_STATUS_PART_FULLY_RENOVATED,
  BUILDING_STATUS_PARTLY_REFURISHED,
  BUILDING_STATUS_IN_NEED_OF_RENOVATION,
  BUILDING_STATUS_READY_TO_BE_BUILT,
  BUILDING_STATUS_BY_AGREEMENT,
  BUILDING_STATUS_MODERNIZED,
  BUILDING_STATUS_CLEANED,
  BUILDING_STATUS_ROUGH_BUILDING,
  BUILDING_STATUS_DEVELOPED,
  BUILDING_STATUS_ABRISSOBJEKT,
  BUILDING_STATUS_PROJECTED,
  BUILDING_STATUS_FULLY_REFURBISHED,
  // firing
  FIRING_OEL,
  FIRING_GAS,
  FIRING_ELECTRIC,
  FIRING_ALTERNATIVE,
  FIRING_SOLAR,
  FIRING_GROUND_HEAT,
  FIRING_AIRWP,
  FIRING_REMOTE,
  FIRING_BLOCK,
  FIRING_WATER_ELECTRIC,
  FIRING_PELLET,
  FIRING_COAL,
  FIRING_WOOD,
  FIRING_LIQUID_GAS,
  // heating
  HEATING_TYPE_NO,
  HEATING_TYPE_OVEN,
  HEATING_TYPE_FLOOR,
  HEATING_TYPE_CENTRAL,
  HEATING_TYPE_REMOTE,
  HEATING_TYPE_UNDERFLOOR,
  HEATING_TYPE_MISC,
  // equipment
  EQUIPMENT_STACK,
  EQUIPMENT_AIR_CONDITIONED,
  EQUIPMENT_ELEVATOR,
  EQUIPMENT_GARDEN_USE,
  EQUIPMENT_WHEELCHAIR_ACCESSIBLE,
  EQUIPMENT_BIKE_ROOM,
  EQUIPMENT_GUEST_WC,
  EQUIPMENT_WG_SUITABLE,
  //
  EQUIPMENT_STANDARD_SIMPLE,
  EQUIPMENT_STANDARD_NORMAL,
  EQUIPMENT_STANDARD_ENHANCED,
  //
  GROUND_TILES,
  GROUND_STONE,
  GROUND_CARPET,
  GROUND_PARQUET,
  GROUND_FINISHED_PARQUET,
  GROUND_LAMINATE,
  GROUND_DIELEN,
  GROUND_PLASTIC,
  GROUND_ESTRICH,
  GROUND_DOUBLE_FLOOR,
  GROUND_LINOLEUM,
  GROUND_MARMOR,
  GROUND_TERRAKOTTA,
  GROUND_GRANITE,
  //
  CURRENCY_EUR,
  CURRENCY_USD,
  CURRENCY_UAH,
  //
  KITCHEN_OPEN,
  KITCHEN_PANTRY,
  KITCHEN_BUILTIN,
  //
  BATH_TUB,
  BATH_WINDOW,
  BATH_BIDET,
  BATH_URINAL,
  BATH_SHOWER,
  //
  PETS_NO,
  PETS_SMALL,
  PETS_ANY,
  //
  KIDS_NO_KIDS,
  KIDS_TO_5,
  KIDS_UP_5,
  //
  SOURCE_TYPE_BUDDY,
  SOURCE_TYPE_MATCHED,
  //
  FAMILY_STATUS_SINGLE,
  FAMILY_STATUS_NO_CHILD,
  FAMILY_STATUS_WITH_CHILD,
  // Letting Status
  LETTING_TYPE_LET,
  LETTING_TYPE_VOID,
  LETTING_TYPE_NA,

  LETTING_STATUS_STANDARD,
  LETTING_STATUS_TERMINATED,
  LETTING_STATUS_VACANCY,
  PARKING_SPACE_TYPE_NO_PARKING,
  ESTATE_FLOOR_DIRECTION_LEFT,
  ESTATE_FLOOR_DIRECTION_RIGHT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT,
  DATE_FORMAT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT_LEFT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT_RIGHT,
  ESTATE_FLOOR_DIRECTION_NA,
  GENDER_NEUTRAL,
  LETTING_STATUS_NEW_RENOVATED,

  INCOME_TYPE_EMPLOYEE,
  INCOME_TYPE_WORKER,
  INCOME_TYPE_UNEMPLOYED,
  INCOME_TYPE_CIVIL_SERVANT,
  INCOME_TYPE_FREELANCER,
  INCOME_TYPE_HOUSE_WORK,
  INCOME_TYPE_PENSIONER,
  INCOME_TYPE_SELF_EMPLOYED,
  INCOME_TYPE_TRAINEE,
  MAX_MINOR_COUNT,
  FURNISHING_NOT_FURNISHED,
  FURNISHING_PARTIALLY_FURNISHED,
  FURNISHING_FULLY_FURNISHED,
  INCOME_TYPE_OTHER_BENEFIT,
  INCOME_TYPE_CHILD_BENEFIT,
  CREDIT_HISTORY_STATUS_NO_NEGATIVE_DATA,
  CREDIT_HISTORY_STATUS_ENFORCEABLE_CLAIMS,
  CREDIT_HISTORY_STATUS_SOME_NEGATIVE_DATA
} = require('../constants')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, OPTION, INVALID_IDS, SIZE, NUMBER, SHOULD_BE_AFTER }
} = require('../exceptions')

yup.addMethod(yup.number, 'mustNotBeSet', function mustNotBeSet() {
  return this.test({
    message: 'Must not be set when heating_costs and/or additional_costs are set.',
    name: 'mustNotBeSet',
    test: (value) => {
      return value === undefined
    }
  })
})

class CreateEstate extends Base {
  static schema = () =>
    yup
      .object()
      .shape({
        breeze_id: yup.string().nullable(),
        coord: yup
          .string()
          .matches(/^(-)?\d{1,3}\.\d+\,(-)?\d{1,3}\.\d+$/)
          .nullable(),
        property_id: yup.string().uppercase().max(20).nullable(),
        property_type: yup
          .number()
          .oneOf([
            PROPERTY_TYPE_APARTMENT,
            PROPERTY_TYPE_ROOM,
            PROPERTY_TYPE_HOUSE,
            PROPERTY_TYPE_SITE,
            PROPERTY_TYPE_OFFICE,
            null
          ])
          .nullable(),
        apt_type: yup
          .number()
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
            APARTMENT_TYPE_ATTIC,
            null
          ])
          .nullable(),
        house_type: yup
          .number()
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
            null
          ])
          .nullable(),
        description: yup.string().min(2).max(500).nullable(),
        category: yup.string().min(2).max(20).nullable(),
        // TODO: add rooms schema
        rooms: yup.mixed(),
        street: yup.string().min(2).max(255).nullable(),
        house_number: yup.string().min(1).max(255).nullable(),
        country: yup.string().min(1).max(255).nullable(),
        floor: yup.number().integer().min(-10).max(200).nullable(),
        floor_direction: yup
          .number()
          .integer()
          .oneOf([
            ESTATE_FLOOR_DIRECTION_NA,
            ESTATE_FLOOR_DIRECTION_LEFT,
            ESTATE_FLOOR_DIRECTION_RIGHT,
            ESTATE_FLOOR_DIRECTION_STRAIGHT,
            ESTATE_FLOOR_DIRECTION_STRAIGHT_LEFT,
            ESTATE_FLOOR_DIRECTION_STRAIGHT_RIGHT,
            null
          ])
          .nullable(),
        number_floors: yup.number().integer().min(1).max(100).nullable(),
        prices: yup.number().min(0).max(100000).nullable(),
        net_rent: yup.number().min(0).max(100000).nullable(),
        cold_rent: yup.number().min(0).max(100000).nullable(),
        rent_including_heating: yup.number().min(0).max(100000).nullable(),
        additional_costs: yup.number().min(0).max(100000).nullable(),
        heating_costs_included: yup.number().min(0).max(100000).nullable(),
        heating_costs: yup.number().min(0).max(100000).nullable(),
        rent_per_sqm: yup.number().min(0).max(100000).nullable(),
        deposit: yup.number().min(0).max(400000).nullable(),
        stp_garage: yup.number().min(0).nullable(),
        stp_parkhaus: yup.number().min(0).nullable(),
        stp_tiefgarage: yup.number().min(0).nullable(),
        currency: yup.string().oneOf([CURRENCY_EUR, CURRENCY_USD, CURRENCY_UAH, null]).nullable(),
        area: yup.number().min(0).nullable(),
        living_space: yup.number().min(0).nullable(),
        usable_area: yup.number().min(0).nullable(),
        rooms_number: yup.number().min(0).nullable(),
        bedrooms_number: yup.number().min(0).nullable(),
        bathrooms_number: yup.number().min(0).nullable(),
        kitchen_options: yup
          .array()
          .of(yup.number().oneOf([KITCHEN_OPEN, KITCHEN_PANTRY, KITCHEN_BUILTIN, null]))
          .nullable(),
        bath_options: yup
          .array()
          .of(
            yup.number().oneOf([BATH_TUB, BATH_WINDOW, BATH_BIDET, BATH_URINAL, BATH_SHOWER, null])
          )
          .nullable(),
        wc_number: yup.number().min(0).nullable(),
        balconies_number: yup.number().min(0).nullable(),
        terraces_number: yup.number().min(0).nullable(),
        occupancy: yup
          .number()
          .oneOf([
            OCCUPATION_TYPE_OCCUPIED_OWN,
            OCCUPATION_TYPE_OCCUPIED_TENANT,
            OCCUPATION_TYPE_WRITE_OFF,
            OCCUPATION_TYPE_VACANCY,
            OCCUPATION_TYPE_NOT_RENT,
            OCCUPATION_TYPE_NOT_OCCUPIED,
            null
          ])
          .nullable(),
        use_type: yup
          .array()
          .of(
            yup
              .number()
              .oneOf([
                USE_TYPE_RESIDENTIAL,
                USE_TYPE_COMMERCIAL,
                USE_TYPE_CONSTRUCT,
                USE_TYPE_WAZ,
                USE_TYPE_PLANT,
                USE_TYPE_OTHER,
                null
              ])
          )
          .nullable(),
        ownership_type: yup
          .number()
          .oneOf([
            OWNERSHIP_TYPE_FREEHOLDER,
            OWNERSHIP_TYPE_DIRECT_PROPERTY,
            OWNERSHIP_TYPE_LEASEHOLD,
            OWNERSHIP_TYPE_OTHER,
            null
          ])
          .nullable(),
        marketing_type: yup
          .array()
          .of(
            yup
              .number()
              .positive()
              .oneOf([
                MARKETING_TYPE_PURCHASE,
                MARKETING_TYPE_RENT_LEASE,
                MARKETING_TYPE_LEASEHOLD,
                MARKETING_TYPE_LEASING
              ])
          )
          .nullable(),
        energy_type: yup
          .array()
          .of(
            yup
              .number()
              .positive()
              .oneOf([
                ENERGY_TYPE_LOW_ENERGY,
                ENERGY_TYPE_PASSIVE_HOUSE,
                ENERGY_TYPE_NEW_BUILDING_STANDARD,
                ENERGY_TYPE_KFW40,
                ENERGY_TYPE_KFW60,
                ENERGY_TYPE_KFW55,
                ENERGY_TYPE_KFW70,
                ENERGY_TYPE_MINERGIE_CONSTRUCTION,
                ENERGY_TYPE_MINERGIE_CERTIFIED
              ])
          )
          .nullable(),
        vacant_date: yup.date().nullable(),
        to_date: yup.date().nullable(),
        // The value should be zero or date
        // The zero means it will be null
        rent_end_at: yup.lazy((value) =>
          typeof value === 'number'
            ? yup.number().integer().min(0).max(0).nullable()
            : yup
                .date()
                .nullable()
                .transform((value, origin) => {
                  return moment.utc(origin, DATE_FORMAT).toDate()
                })
        ),
        // .when(['vacant_date'], (vacant_date, schema, { value }) => {
        //   if (!vacant_date) return schema
        //   return value && value <= vacant_date
        //     ? yup
        //         .date()
        //         .min(
        //           vacant_date,
        //           getExceptionMessage('rent_end_at', SHOULD_BE_AFTER, vacant_date)
        //         )
        //     : schema
        // }),

        min_lease_duration: yup.number().integer().min(0).nullable(),
        max_lease_duration: yup.number().integer().min(0).nullable(),
        non_smoker: yup.boolean().nullable(),
        pets_allowed: yup.number().integer().oneOf([PETS_NO, PETS_SMALL, null]).nullable(),
        gender: yup
          .number()
          .integer()
          .oneOf([GENDER_MALE, GENDER_FEMALE, GENDER_NEUTRAL, GENDER_ANY, null])
          .nullable(),
        monumental_protection: yup.boolean().nullable(),
        parking_space: yup.number().min(0).max(10),
        parking_space_type: yup
          .number()
          .oneOf([
            PARKING_SPACE_TYPE_NO_PARKING,
            PARKING_SPACE_TYPE_UNDERGROUND,
            PARKING_SPACE_TYPE_CARPORT,
            PARKING_SPACE_TYPE_OUTDOOR,
            PARKING_SPACE_TYPE_CAR_PARK,
            PARKING_SPACE_TYPE_DUPLEX,
            PARKING_SPACE_TYPE_GARAGE,
            null
          ])
          .nullable(),
        construction_year: yup.date().nullable(),
        last_modernization: yup.number().min(1000).max(new Date().getFullYear()),
        building_status: yup
          .number()
          .oneOf([
            BUILDING_STATUS_FIRST_TIME_OCCUPIED,
            BUILDING_STATUS_PART_COMPLETE_RENOVATION_NEED,
            BUILDING_STATUS_NEW,
            BUILDING_STATUS_EXISTING,
            BUILDING_STATUS_PART_FULLY_RENOVATED,
            BUILDING_STATUS_PARTLY_REFURISHED,
            BUILDING_STATUS_IN_NEED_OF_RENOVATION,
            BUILDING_STATUS_READY_TO_BE_BUILT,
            BUILDING_STATUS_BY_AGREEMENT,
            BUILDING_STATUS_MODERNIZED,
            BUILDING_STATUS_CLEANED,
            BUILDING_STATUS_ROUGH_BUILDING,
            BUILDING_STATUS_DEVELOPED,
            BUILDING_STATUS_ABRISSOBJEKT,
            BUILDING_STATUS_PROJECTED,
            BUILDING_STATUS_FULLY_REFURBISHED,
            null
          ])
          .nullable(),
        building_age: yup.number().integer().min(0).nullable(),
        firing: yup
          .array()
          .of(
            yup
              .number()
              .positive()
              .oneOf([
                FIRING_OEL,
                FIRING_GAS,
                FIRING_ELECTRIC,
                FIRING_ALTERNATIVE,
                FIRING_SOLAR,
                FIRING_GROUND_HEAT,
                FIRING_AIRWP,
                FIRING_REMOTE,
                FIRING_BLOCK,
                FIRING_WATER_ELECTRIC,
                FIRING_PELLET,
                FIRING_COAL,
                FIRING_WOOD,
                FIRING_LIQUID_GAS
              ])
          )
          .nullable(),
        heating_type: yup
          .array()
          .of(
            yup
              .number()
              .oneOf([
                HEATING_TYPE_NO,
                HEATING_TYPE_CENTRAL,
                HEATING_TYPE_FLOOR,
                HEATING_TYPE_REMOTE,
                HEATING_TYPE_OVEN,
                HEATING_TYPE_UNDERFLOOR,
                HEATING_TYPE_MISC
              ])
          )
          .nullable(),
        equipment: yup
          .number()
          .oneOf([
            EQUIPMENT_STACK,
            EQUIPMENT_AIR_CONDITIONED,
            EQUIPMENT_ELEVATOR,
            EQUIPMENT_GARDEN_USE,
            EQUIPMENT_WHEELCHAIR_ACCESSIBLE,
            EQUIPMENT_BIKE_ROOM,
            EQUIPMENT_GUEST_WC,
            EQUIPMENT_WG_SUITABLE,
            null
          ])
          .nullable(),
        equipment_standard: yup
          .number()
          .oneOf([
            EQUIPMENT_STANDARD_SIMPLE,
            EQUIPMENT_STANDARD_NORMAL,
            EQUIPMENT_STANDARD_ENHANCED,
            null
          ])
          .nullable(),
        ground: yup
          .array()
          .of(
            yup
              .number()
              .positive()
              .oneOf([
                GROUND_TILES,
                GROUND_STONE,
                GROUND_CARPET,
                GROUND_PARQUET,
                GROUND_FINISHED_PARQUET,
                GROUND_LAMINATE,
                GROUND_DIELEN,
                GROUND_PLASTIC,
                GROUND_ESTRICH,
                GROUND_DOUBLE_FLOOR,
                GROUND_LINOLEUM,
                GROUND_MARMOR,
                GROUND_TERRAKOTTA,
                GROUND_GRANITE,
                null
              ])
          )
          .nullable(),
        energy_efficiency: yup.number().positive().nullable(),
        energy_pass: yup
          .mixed()
          .oneOf([
            yup.object().shape({
              officency_pass: yup.string(),
              valid_until: yup.string(),
              energy_consumption_value: yup.string(),
              final_energy_consumption: yup.string()
            })
          ])
          .nullable(),
        energy_proof: yup.mixed().nullable(),
        city: yup.string().max(40).nullable(),
        zip: yup.string().max(8).nullable(),
        budget: yup
          .number()
          .integer()
          .when(['net_rent'], {
            is: (net_rent) => net_rent > 0,
            then: yup.number().min(yup.ref('net_rent')),
            otherwise: yup.number().integer()
          })
          .nullable(),
        rent_arrears: yup.boolean().nullable(),
        full_address: yup.boolean().nullable(),
        photo_require: yup.boolean().nullable(),
        furnished: yup
          .number()
          .integer()
          .oneOf([
            FURNISHING_NOT_FURNISHED,
            FURNISHING_PARTIALLY_FURNISHED,
            FURNISHING_FULLY_FURNISHED,
            null
          ])
          .nullable(),
        kids_type: yup.number().integer().min(0).max(MAX_MINOR_COUNT).nullable(),
        source_person: yup
          .number()
          .integer()
          .oneOf([SOURCE_TYPE_BUDDY, SOURCE_TYPE_MATCHED, null])
          .nullable(),
        family_status: yup
          .number()
          .integer()
          .oneOf([FAMILY_STATUS_WITH_CHILD, FAMILY_STATUS_SINGLE, FAMILY_STATUS_NO_CHILD, null])
          .nullable(),
        options: yup.array().of(yup.number().integer().positive().max(999)).nullable(),
        min_age: yup.number().integer().min(0).max(120).nullable(),
        max_age: yup.number().integer().min(0).max(120).nullable(),
        minors: yup.boolean().nullable(),
        letting_status: yup
          .number()
          .oneOf([
            LETTING_STATUS_STANDARD,
            LETTING_STATUS_TERMINATED,
            LETTING_STATUS_NEW_RENOVATED,
            LETTING_STATUS_VACANCY,
            null
          ])
          .nullable(),
        letting_type: yup
          .number()
          .oneOf([LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA, null])
          .nullable(),
        family_size_max: yup.number().integer().min(1).max(100).nullable(),
        family_size_min: yup.number().integer(),
        apartment_status: yup
          .number()
          .integer()
          .oneOf([
            BUILDING_STATUS_FIRST_TIME_OCCUPIED,
            BUILDING_STATUS_PART_COMPLETE_RENOVATION_NEED,
            BUILDING_STATUS_NEW,
            BUILDING_STATUS_EXISTING,
            BUILDING_STATUS_PART_FULLY_RENOVATED,
            BUILDING_STATUS_PARTLY_REFURISHED,
            BUILDING_STATUS_IN_NEED_OF_RENOVATION,
            BUILDING_STATUS_READY_TO_BE_BUILT,
            BUILDING_STATUS_BY_AGREEMENT,
            BUILDING_STATUS_MODERNIZED,
            BUILDING_STATUS_CLEANED,
            BUILDING_STATUS_ROUGH_BUILDING,
            BUILDING_STATUS_DEVELOPED,
            BUILDING_STATUS_ABRISSOBJEKT,
            BUILDING_STATUS_PROJECTED,
            BUILDING_STATUS_FULLY_REFURBISHED,
            null
          ])
          .nullable(),
        extra_address: yup.string().min(0).max(255).nullable(),
        extra_costs: yup
          .number()
          .when(['additional_costs', 'heating_costs'], {
            is: (additional_costs, heating_costs) => {
              return additional_costs || heating_costs
            },
            then: yup.number().mustNotBeSet(),
            otherwise: yup.number().min(0).max(1000000)
          })
          .nullable(),
        is_new_tenant_transfer: yup.boolean().default(false).nullable(),
        transfer_budget: yup.number().when(['is_new_tenant_transfer'], {
          is: (is_new_tenant_transfer) => {
            return is_new_tenant_transfer
          },
          then: yup.number().integer().required(),
          otherwise: yup.number().nullable()
        }),
        income_sources: yup
          .array()
          .of(
            yup
              .string()
              .oneOf([
                INCOME_TYPE_EMPLOYEE,
                INCOME_TYPE_WORKER,
                INCOME_TYPE_UNEMPLOYED,
                INCOME_TYPE_CIVIL_SERVANT,
                INCOME_TYPE_FREELANCER,
                INCOME_TYPE_HOUSE_WORK,
                INCOME_TYPE_PENSIONER,
                INCOME_TYPE_SELF_EMPLOYED,
                INCOME_TYPE_TRAINEE,
                INCOME_TYPE_OTHER_BENEFIT,
                INCOME_TYPE_CHILD_BENEFIT,
                null
              ])
              .nullable()
          ),
        is_not_show: yup.boolean().nullable(),
        skip_timeslots: yup.boolean().nullable(),
        credit_history_status: yup
          .number()
          .integer()
          .oneOf([
            CREDIT_HISTORY_STATUS_NO_NEGATIVE_DATA,
            CREDIT_HISTORY_STATUS_ENFORCEABLE_CLAIMS,
            CREDIT_HISTORY_STATUS_SOME_NEGATIVE_DATA,
            null
          ])
          .nullable()
      })
      .concat(PublishInfo.schema())
}

module.exports = CreateEstate
