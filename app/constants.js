const constants = {
  ERROR_AGREEMENT_CONFIRM: 10020,
  ERROR_TERMS_CONFIRM: 10030,

  FILE_TYPE_COVER: 'cover',
  FILE_TYPE_PLAN: 'plan',
  FILE_TYPE_DOC: 'doc',

  DEVICE_TYPE_ANDROID: 'android',
  DEVICE_TYPE_IOS: 'ios',

  CURRENCY_EUR: 'EUR',
  CURRENCY_DEM: 'DEM',
  CURRENCY_USD: 'USD',
  CURRENCY_UAH: 'UAH',

  STATUS_ACTIVE: 1,
  STATUS_DELETE: 2,
  STATUS_NEED_VERIFY: 3,
  STATUS_EMAIL_VERIFY: 4,
  STATUS_DRAFT: 5,

  ROLE_ADMIN: 2,
  ROLE_LANDLORD: 1,
  ROLE_USER: 3,

  GENDER_MALE: 1,
  GENDER_FEMALE: 2,
  GENDER_ANY: 3,

  OCCUPATION_TYPE_OCCUPIED_OWN: 1,
  OCCUPATION_TYPE_OCCUPIED_TENANT: 2,
  OCCUPATION_TYPE_WRITE_OFF: 3,
  OCCUPATION_TYPE_VACANCY: 4,
  OCCUPATION_TYPE_NOT_RENT: 5,
  OCCUPATION_TYPE_NOT_OCCUPIED: 6,

  USE_TYPE_RESIDENTIAL: 1,
  USE_TYPE_COMMERCIAL: 2,
  USE_TYPE_CONSTRUCT: 3,
  USE_TYPE_WAZ: 4,

  OWNERSHIP_TYPE_FREEHOLDER: 1,
  OWNERSHIP_TYPE_DIRECT_PROPERTY: 2,
  OWNERSHIP_TYPE_LEASEHOLD: 3,
  OWNERSHIP_TYPE_OTHER: 4,

  MARKETING_TYPE_PURCHASE: 1,
  MARKETING_TYPE_RENT_LEASE: 2,
  MARKETING_TYPE_LEASEHOLD: 3,
  MARKETING_TYPE_LEASING: 4,

  // property_type
  PROPERTY_TYPE_APARTMENT: 1,
  PROPERTY_TYPE_ROOM: 2,
  PROPERTY_TYPE_HOUSE: 3,
  PROPERTY_TYPE_SITE: 4,

  ENERGY_TYPE_LOW_ENERGY: 1,
  ENERGY_TYPE_PASSIVE_HOUSE: 2,
  ENERGY_TYPE_NEW_BUILDING_STANDARD: 3,
  ENERGY_TYPE_KFW40: 4,
  ENERGY_TYPE_KFW60: 5,
  ENERGY_TYPE_KFW55: 6,
  ENERGY_TYPE_KFW70: 7,
  ENERGY_TYPE_MINERGIE_CONSTRUCTION: 8,
  ENERGY_TYPE_MINERGIE_CERTIFIED: 9,

  BUILDING_STATUS_FIRST_TIME_OCCUPIED: 1,
  BUILDING_STATUS_PART_COMPLETE_RENOVATION_NEED: 2,
  BUILDING_STATUS_NEW: 3,
  BUILDING_STATUS_EXISTING: 4,
  BUILDING_STATUS_PART_FULLY_RENOVATED: 5,
  BUILDING_STATUS_PARTLY_REFURISHED: 6,
  BUILDING_STATUS_IN_NEED_OF_RENOVATION: 7,
  BUILDING_STATUS_READY_TO_BE_BUILT: 8,
  BUILDING_STATUS_BY_AGREEMENT: 9,
  BUILDING_STATUS_MODERNIZED: 10,
  BUILDING_STATUS_CLEANED: 11,
  BUILDING_STATUS_ROUGH_BUILDING: 12,
  BUILDING_STATUS_DEVELOPED: 13,
  BUILDING_STATUS_ABRISSOBJEKT: 14,
  BUILDING_STATUS_PROJECTED: 15,

  ROOM_TYPE_GUEST_ROOM: 1,
  ROOM_TYPE_BATH: 2,
  ROOM_TYPE_BEDROOM: 3,
  ROOM_TYPE_KITCHEN: 4,
  ROOM_TYPE_CORRIDOR: 5,
  ROOM_TYPE_OFFICE: 6,
  ROOM_TYPE_PANTRY: 7,
  ROOM_TYPE_CHILDRENS_ROOM: 8,
  ROOM_TYPE_BALCONY: 9,
  ROOM_TYPE_WC: 10,
  ROOM_TYPE_OTHER_SPACE: 11,
  ROOM_TYPE_CHECKROOM: 12,
  ROOM_TYPE_DINING_ROOM: 13,
  ROOM_TYPE_ENTRANCE_HALL: 14,
  ROOM_TYPE_GYM: 15,
  ROOM_TYPE_IRONING_ROOM: 16,
  ROOM_TYPE_LIVING_ROOM: 17,
  ROOM_TYPE_LOBBY: 18,
  ROOM_TYPE_MASSAGE_ROOM: 19,
  ROOM_TYPE_STORAGE_ROOM: 20,
  ROOM_TYPE_PLACE_FOR_GAMES: 21,
  ROOM_TYPE_SAUNA: 22,
  ROOM_TYPE_SHOWER: 23,
  ROOM_TYPE_STAFF_ROOM: 24,
  ROOM_TYPE_SWIMMING_POOL: 25,
  ROOM_TYPE_TECHNICAL_ROOM: 26,
  ROOM_TYPE_TERRACE: 27,
  ROOM_TYPE_WASHING_ROOM: 28,
  ROOM_TYPE_EXTERNAL_CORRIDOR: 29,
  ROOM_TYPE_STAIRS: 30,
  ROOM_TYPE_PROPERTY_ENTRANCE: 31,
  ROOM_TYPE_GARDEN: 32,
  ROOM_TYPE_LOGGIA: 33,

  APARTMENT_TYPE_LOFT_STUDIO_ATELIER: 1,
  APARTMENT_TYPE_PENTHOUSE: 2,
  APARTMENT_TYPE_TERRACES: 3,
  APARTMENT_TYPE_FLOOR: 4,
  APARTMENT_TYPE_GROUND_FLOOR: 5,
  APARTMENT_TYPE_SOUTERRAIN: 6,
  APARTMENT_TYPE_APARTMENT: 7,
  APARTMENT_TYPE_HOLIDAY_APARTMENT: 8,
  APARTMENT_TYPE_GALLERY: 9,
  APARTMENT_TYPE_ROOF_FLOOR: 10,
  APARTMENT_TYPE_ATTIKA_APARTMENT: 11,
  APARTMENT_TYPE_NO_ADDRESS: 12,
  HOUSE_TYPE_REIHENHAUS: 13,
  HOUSE_TYPE_REIHEND: 14,
  HOUSE_TYPE_REIHENMITTEL: 15,
  HOUSE_TYPE_REIHENECK: 16,
  HOUSE_TYPE_SEMI_DETACHED_HOUSE: 17,
  HOUSE_TYPE_DETACHED_HOUSE: 18,
  HOUSE_TYPE_CITY_HOUSE: 19,
  HOUSE_TYPE_BUNGALOW: 20,
  HOUSE_TYPE_VILLA: 21,
  HOUSE_TYPE_RESTHOF: 22,
  HOUSE_TYPE_BUILDERS_HOUSE: 23,
  HOUSE_TYPE_COUNTRY_HOUSE: 24,
  HOUSE_TYPE_CASTLE: 25,
  HOUSE_TYPE_TWO_FAMILY_HOUSE: 26,
  HOUSE_TYPE_MULTI_FAMILY_HOUSE: 27,
  HOUSE_TYPE_HOLIDAY_HOUSE: 28,
  HOUSE_TYPE_MOUNTAIN_HOUSE: 29,
  HOUSE_TYPE_CHALET: 30,
  HOUSE_TYPE_BEACH_HOUSE: 31,
  HOUSE_TYPE_LAUBE_DATSCHE_GARDENHOUSE: 32,
  HOUSE_TYPE_APARTMENT_HOUSE: 33,
  HOUSE_TYPE_LORDS_HOUSE: 34,
  HOUSE_TYPE_FINCA: 35,
  HOUSE_TYPE_RUSTICO: 36,
  HOUSE_TYPE_FINISHED_HOUSE: 37,
  HOUSE_TYPE_NO_ADDRESS: 38,
  APARTMENT_TYPE_MAISONETTE: 39,
  APARTMENT_TYPE_SOCIAL: 40,

  PARKING_SPACE_TYPE_UNDERGROUND: 1,
  PARKING_SPACE_TYPE_CARPORT: 2,
  PARKING_SPACE_TYPE_OUTDOOR: 3,
  PARKING_SPACE_TYPE_CAR_PARK: 4,
  PARKING_SPACE_TYPE_DUPLEX: 5,
  PARKING_SPACE_TYPE_GARAGE: 6,

  FIRING_OEL: 1,
  FIRING_GAS: 2,
  FIRING_ELECTRIC: 3,
  FIRING_ALTERNATIVE: 4,
  FIRING_SOLAR: 5,
  FIRING_GROUND_HEAT: 6,
  FIRING_AIRWP: 7,
  FIRING_REMOTE: 8,
  FIRING_BLOCK: 9,
  FIRING_WATER_ELECTRIC: 10,
  FIRING_PELLET: 11,
  FIRING_COAL: 12,
  FIRING_WOOD: 13,
  FIRING_LIQUID_GAS: 14,

  HEATING_TYPE_OVEN: 1,
  HEATING_TYPE_FLOOR: 2,
  HEATING_TYPE_CENTRAL: 3,
  HEATING_TYPE_REMOTE: 4,

  EQUIPMENT_STANDARD_SIMPLE: 1,
  EQUIPMENT_STANDARD_NORMAL: 2,
  EQUIPMENT_STANDARD_ENHANCED: 3,

  ATTACHMENT_TITLE_PICTURE: 1,
  ATTACHMENT_INTERIOR_VIEWS: 2,
  ATTACHMENT_EXTERIOR_VIEWS: 3,
  ATTACHMENT_FLOOR_PLAN: 4,
  ATTACHMENT_MAPS_SITE_PLAN: 5,
  ATTACHMENT_PROVIDER_LOGO: 6,
  ATTACHMENT_PICTURE: 7,
  ATTACHMENT_DOCUMENTS: 8,
  ATTACHMENT_LINKS: 9,
  ATTACHMENT_PANORAMA: 10,
  ATTACHMENT_QRCODE: 11,
  ATTACHMENT_FILM: 12,
  ATTACHMENT_FILMLINK: 13,
  ATTACHMENT_EPASS_SCALE: 14,
  ATTACHMENT_ANBOBJURL: 5,

  GROUND_TILES: 1,
  GROUND_STONE: 2,
  GROUND_CARPET: 3,
  GROUND_PARQUET: 4,
  GROUND_FINISHED_PARQUET: 5,
  GROUND_LAMINATE: 6,
  GROUND_DIELEN: 7,
  GROUND_PLASTIC: 8,
  GROUND_ESTRICH: 9,
  GROUND_DOUBLE_FLOOR: 10,
  GROUND_LINOLEUM: 11,
  GROUND_MARMOR: 12,
  GROUND_TERRAKOTTA: 13,
  GROUND_GRANITE: 14,

  BATH_TUB: 1,
  BATH_WINDOW: 2,
  BATH_BIDET: 3,
  BATH_URINAL: 4,
  BATH_SHOWER: 5,

  KITCHEN_OPEN: 1,
  KITCHEN_PANTRY: 2,
  KITCHEN_BUILTIN: 3,

  EQUIPMENT_STACK: 1,
  EQUIPMENT_AIR_CONDITIONED: 2,
  EQUIPMENT_ELEVATOR: 3,
  EQUIPMENT_GARDEN_USE: 4,
  EQUIPMENT_WHEELCHAIR_ACCESSIBLE: 5,
  EQUIPMENT_BIKE_ROOM: 6,
  EQUIPMENT_GUEST_WC: 7,
  EQUIPMENT_WG_SUITABLE: 8,

  PETS_NO: 1,
  PETS_SMALL: 2,
  PETS_ANY: 3,

  KIDS_NO_KIDS: 1,
  KIDS_TO_5: 2,
  KIDS_UP_5: 3,

  SOURCE_TYPE_BUDDY: 1,
  SOURCE_TYPE_MATCHED: 2,

  HOUSEHOLD_TYPE_SINGLE: 1,
  HOUSEHOLD_TYPE_COUPLE: 2,

  ADULT_AGE_25: 1,
  ADULT_AGE_25_59: 2,
  ADULT_AGE_60: 3,

  LANDLORD_SIZE_SMALL: 1,
  LANDLORD_SIZE_MID: 2,
  LANDLORD_SIZE_LARGE: 3,
}

module.exports = constants
