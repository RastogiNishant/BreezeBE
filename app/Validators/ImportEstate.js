'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED },
} = require('../exceptions')

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
  //Letting Status
  LETTING_TYPE_LET,
  LETTING_TYPE_VOID,
  LETTING_TYPE_NA,

  LETTING_STATUS_STANDARD,
  LETTING_STATUS_TERMINATED,
  LETTING_STATUS_VACANCY,
  PARKING_SPACE_TYPE_NO_PARKING,

  ESTATE_FLOOR_DIRECTION_NA,
  ESTATE_FLOOR_DIRECTION_LEFT,
  ESTATE_FLOOR_DIRECTION_RIGHT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT_LEFT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT_RIGHT,
  GENDER_NEUTRAL,
  LETTING_STATUS_NEW_RENOVATED,
  MAX_MINOR_COUNT,
} = require('../constants')

yup.addMethod(yup.number, 'mustNotBeSet', function mustNotBeSet() {
  return this.test({
    message: 'Must not be set when heating_costs and/or additional_costs are set.',
    name: 'mustNotBeSet',
    test: (value) => {
      return value === undefined
    },
  })
})

class ImportEstate extends Base {
  static schema = () =>
    yup.object().shape({
      breeze_id: yup.string().nullable(),
      coord: yup.string().matches(/^(-)?\d{1,3}\.\d{5,8}\,(-)?\d{1,3}\.\d{5,8}$/),
      property_id: yup.string().uppercase().max(20).nullable(),
      property_type: yup
        .number()
        .positive()
        .oneOf([
          PROPERTY_TYPE_APARTMENT,
          PROPERTY_TYPE_ROOM,
          PROPERTY_TYPE_HOUSE,
          PROPERTY_TYPE_SITE,
          PROPERTY_TYPE_OFFICE,
        ])
        .required(getExceptionMessage('Property type', REQUIRED)),
      apt_type: yup
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
        ]),
      house_type: yup
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
        ]),
      description: yup.string().min(2).max(500),
      category: yup.string().min(2).max(20),
      // TODO: add rooms schema
      rooms: yup.mixed(),
      street: yup.string().min(2).max(255).required(getExceptionMessage('Street', REQUIRED)),
      house_number: yup
        .string()
        .min(1)
        .max(255)
        .required(getExceptionMessage('House Number', REQUIRED)),
      country: yup.string().min(1).max(255).required(getExceptionMessage('Country', REQUIRED)),
      floor: yup.number().integer().min(-10).max(200),
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
        ]),
      number_floors: yup.number().integer().min(1).max(100),
      prices: yup.number().min(0).max(100000),
      net_rent: yup.number().min(0).max(100000),
      cold_rent: yup.number().min(0).max(100000),
      rent_including_heating: yup.number().min(0).max(100000),
      additional_costs: yup.number().min(0).max(100000),
      heating_costs_included: yup.number().min(0).max(100000),
      heating_costs: yup.number().min(0).max(100000),
      rent_per_sqm: yup.number().min(0).max(100000),
      deposit: yup.number().min(0).max(400000),
      stp_garage: yup.number().min(0),
      stp_parkhaus: yup.number().min(0),
      stp_tiefgarage: yup.number().min(0),
      currency: yup
        .string()
        .oneOf([CURRENCY_EUR, CURRENCY_USD, CURRENCY_UAH])
        .default(CURRENCY_EUR),
      area: yup.number().min(0),
      living_space: yup.number().min(0),
      usable_area: yup.number().min(0),
      rooms_number: yup.number().max(99).min(0), //decimal with 1 decimal place, will truncate if more decimal places
      bedrooms_number: yup.number().min(0),
      bathrooms_number: yup.number().min(0),
      kitchen_options: yup
        .array()
        .of(yup.number().oneOf([KITCHEN_OPEN, KITCHEN_PANTRY, KITCHEN_BUILTIN])),
      bath_options: yup
        .array()
        .of(yup.number().oneOf([BATH_TUB, BATH_WINDOW, BATH_BIDET, BATH_URINAL, BATH_SHOWER])),
      wc_number: yup.number().min(0),
      balconies_number: yup.number().min(0),
      terraces_number: yup.number().min(0),
      occupancy: yup
        .number()
        .positive()
        .oneOf([
          OCCUPATION_TYPE_OCCUPIED_OWN,
          OCCUPATION_TYPE_OCCUPIED_TENANT,
          OCCUPATION_TYPE_WRITE_OFF,
          OCCUPATION_TYPE_VACANCY,
          OCCUPATION_TYPE_NOT_RENT,
          OCCUPATION_TYPE_NOT_OCCUPIED,
        ]),
      use_type: yup
        .number()
        .positive()
        .oneOf([
          USE_TYPE_RESIDENTIAL,
          USE_TYPE_COMMERCIAL,
          USE_TYPE_CONSTRUCT,
          USE_TYPE_WAZ,
          USE_TYPE_PLANT,
          USE_TYPE_OTHER,
        ]),
      ownership_type: yup
        .number()
        .positive()
        .oneOf([
          OWNERSHIP_TYPE_FREEHOLDER,
          OWNERSHIP_TYPE_DIRECT_PROPERTY,
          OWNERSHIP_TYPE_LEASEHOLD,
          OWNERSHIP_TYPE_OTHER,
        ]),
      marketing_type: yup
        .number()
        .positive()
        .oneOf([
          MARKETING_TYPE_PURCHASE,
          MARKETING_TYPE_RENT_LEASE,
          MARKETING_TYPE_LEASEHOLD,
          MARKETING_TYPE_LEASING,
        ]),
      energy_type: yup
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
          ENERGY_TYPE_MINERGIE_CERTIFIED,
        ]),
      vacant_date: yup.date(),
      available_start_at: yup.date().nullable(),
      available_end_at: yup
        .date()
        .min(new Date())
        .when(['available_start_at'], (available_start_at, schema, { value }) => {
          console.log('available_start_at=', available_start_at)
          if (!available_start_at) return schema
          return value && value <= available_start_at
            ? yup
                .date()
                .min(
                  available_start_at,
                  getExceptionMessage(
                    'available_end_at',
                    SHOULD_BE_AFTER,
                    moment(available_start_at).format(DATE_FORMAT)
                  )
                )
            : schema
        })
        .nullable(),
      to_date: yup.date(),
      min_lease_duration: yup.number().integer().min(0),
      max_lease_duration: yup.number().integer().min(0),
      non_smoker: yup.boolean(),
      pets: yup.number().integer().oneOf([PETS_NO, PETS_SMALL, null]).nullable(),
      gender: yup
        .number()
        .integer()
        .oneOf([GENDER_MALE, GENDER_FEMALE, GENDER_NEUTRAL, GENDER_ANY, null])
        .nullable(),
      monumental_protection: yup.boolean(),
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
        ]),
      construction_year: yup.date().nullable(),
      last_modernization: yup.date().nullable(),
      building_status: yup
        .number()
        .positive()
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
        ]),
      building_age: yup.number().integer().min(0),
      firing: yup
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
          FIRING_LIQUID_GAS,
        ]),
      heating_type: yup
        .number()
        // .positive()
        .oneOf([
          HEATING_TYPE_NO,
          HEATING_TYPE_OVEN,
          HEATING_TYPE_FLOOR,
          HEATING_TYPE_CENTRAL,
          HEATING_TYPE_REMOTE,
        ]),
      equipment: yup
        .array()
        .of(
          yup
            .number()
            .positive()
            .oneOf([
              EQUIPMENT_STACK,
              EQUIPMENT_AIR_CONDITIONED,
              EQUIPMENT_ELEVATOR,
              EQUIPMENT_GARDEN_USE,
              EQUIPMENT_WHEELCHAIR_ACCESSIBLE,
              EQUIPMENT_BIKE_ROOM,
              EQUIPMENT_GUEST_WC,
              EQUIPMENT_WG_SUITABLE,
            ])
        ),
      equipment_standard: yup
        .number()
        .positive()
        .oneOf([EQUIPMENT_STANDARD_SIMPLE, EQUIPMENT_STANDARD_NORMAL, EQUIPMENT_STANDARD_ENHANCED]),
      ground: yup
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
          null,
        ])
        .nullable(),
      energy_efficiency: yup.number().positive().nullable(),
      energy_pass: yup
        .mixed()
        .oneOf([
          yup.object().shape({
            officency_pass: yup.string(),
            valid_until: yup.string(),
            energy_consumption_value: yup.string(),
            final_energy_consumption: yup.string(),
          }),
        ])
        .nullable(),
      status: yup.number().integer().positive().oneOf([STATUS_ACTIVE, STATUS_DELETE, STATUS_DRAFT]),
      city: yup.string().max(40).required(getExceptionMessage('City', REQUIRED)),
      zip: yup.string().max(8).required(getExceptionMessage('Post Code', REQUIRED)),
      budget: yup.number().integer().min(0).max(100),
      credit_score: yup.number().min(0).max(100),
      rent_arrears: yup.boolean(),
      full_address: yup.boolean(),
      photo_require: yup.boolean(),
      furnished: yup.boolean().nullable(),
      kids_type: yup.number().integer().min(0).max(MAX_MINOR_COUNT).nullable(),
      source_person: yup
        .number()
        .integer()
        .oneOf([SOURCE_TYPE_BUDDY, SOURCE_TYPE_MATCHED])
        .nullable(),
      family_status: yup
        .number()
        .integer()
        .oneOf([FAMILY_STATUS_WITH_CHILD, FAMILY_STATUS_SINGLE, FAMILY_STATUS_NO_CHILD, null])
        .nullable(),
      options: yup.array().of(yup.number().integer().positive().max(999)),
      min_age: yup.number().integer().min(0).max(120),
      max_age: yup.number().integer().min(0).max(120),
      minors: yup.boolean(),
      letting_status: yup
        .number()
        .oneOf([
          LETTING_STATUS_STANDARD,
          LETTING_STATUS_TERMINATED,
          LETTING_STATUS_NEW_RENOVATED,
          LETTING_STATUS_VACANCY,
        ]),
      letting_type: yup.number().oneOf([LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA]),
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
        ]),
      extra_address: yup.string().min(0).max(255).nullable(),
      extra_costs: yup
        .number()
        .when(['additional_costs', 'heating_costs'], {
          is: (additional_costs, heating_costs) => {
            return additional_costs || heating_costs
          },
          then: yup.number().mustNotBeSet(),
          otherwise: yup.number().min(0).max(1000000),
        })
        .nullable(),
    })
}

module.exports = ImportEstate
