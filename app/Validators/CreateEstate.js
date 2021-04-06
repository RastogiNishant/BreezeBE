'use strict'

const yup = require('yup')

const {
  STATUS_ACTIVE,
  STATUS_DELETE,
  STATUS_DRAFT,
  // property_type
  PROPERTY_TYPE_APARTMENT,
  PROPERTY_TYPE_ROOM,
  PROPERTY_TYPE_HOUSE,
  PROPERTY_TYPE_SITE,
  // type
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
  APARTMENT_TYPE_MAISONETTE,
  APARTMENT_TYPE_SOCIAL,
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
  CURRENCY_DEM,
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
} = require('../constants')

class CreateEstate {
  static schema = () =>
    yup.object().shape({
      coord: yup.string().matches(/^\d{1,3}\.\d{5,8}\,\d{1,3}\.\d{5,8}$/),
      property_type: yup
        .number()
        .positive()
        .oneOf([
          PROPERTY_TYPE_APARTMENT,
          PROPERTY_TYPE_ROOM,
          PROPERTY_TYPE_HOUSE,
          PROPERTY_TYPE_SITE,
        ]),
      type: yup
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
          APARTMENT_TYPE_MAISONETTE,
          APARTMENT_TYPE_SOCIAL,
        ]),
      description: yup.string().min(2).max(500),
      category: yup.string().min(2).max(20),
      // TODO: add rooms schema
      rooms: yup.mixed(),
      street: yup.string().min(2).max(255),
      house_number: yup.string().min(1).max(255),
      country: yup.string().min(1).max(255),
      floor: yup.number().integer().min(-10).max(200),
      number_floors: yup.number().integer().min(1).max(100),
      prices: yup.number().positive().min(1),
      net_rent: yup.number().positive().min(1),
      cold_rent: yup.number().positive().min(1),
      rent_including_heating: yup.number().positive().min(1),
      additional_costs: yup.number().min(0),
      heating_costs_included: yup.number().min(0),
      heating_costs: yup.number().min(0),
      rent_per_sqm: yup.number().min(0),
      deposit: yup.number().min(0),
      stp_garage: yup.number().min(0),
      stp_parkhaus: yup.number().min(0),
      stp_tiefgarage: yup.number().min(0),
      currency: yup.string().oneOf([CURRENCY_EUR, CURRENCY_DEM, CURRENCY_USD, CURRENCY_UAH]),
      area: yup.number().min(0),
      living_space: yup.number().min(0),
      usable_area: yup.number().min(0),
      rooms_number: yup.number().min(0),
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
        .oneOf([USE_TYPE_RESIDENTIAL, USE_TYPE_COMMERCIAL, USE_TYPE_CONSTRUCT, USE_TYPE_WAZ]),
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
      available_date: yup.date(),
      from_date: yup.date(),
      to_date: yup.date(),
      min_lease_duration: yup.number().integer().min(0),
      max_lease_duration: yup.number().integer().min(0),
      non_smoker: yup.boolean(),
      pets: yup.boolean(),
      gender: yup.number().integer().oneOf([GENDER_MALE, GENDER_FEMALE, GENDER_ANY]),
      monumental_protection: yup.boolean(),
      parking_space_type: yup
        .number()
        .positive()
        .oneOf([
          PARKING_SPACE_TYPE_UNDERGROUND,
          PARKING_SPACE_TYPE_CARPORT,
          PARKING_SPACE_TYPE_OUTDOOR,
          PARKING_SPACE_TYPE_CAR_PARK,
          PARKING_SPACE_TYPE_DUPLEX,
          PARKING_SPACE_TYPE_GARAGE,
        ]),
      construction_year: yup.date(),
      last_modernization: yup.date(),
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
        .positive()
        .oneOf([HEATING_TYPE_OVEN, HEATING_TYPE_FLOOR, HEATING_TYPE_CENTRAL, HEATING_TYPE_REMOTE]),
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
        ]),
      energy_efficiency: yup.number().positive(),
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
    })
}

module.exports = CreateEstate
