const l = use('Localize')
const { trim, isEmpty } = require('lodash')
const HttpException = use('App/Exceptions/HttpException')
const {
  AVAILABLE_LANGUAGES,

  PROPERTY_TYPE_APARTMENT,
  PROPERTY_TYPE_ROOM,
  PROPERTY_TYPE_HOUSE,
  PROPERTY_TYPE_SITE,
  PROPERTY_TYPE_OFFICE,

  APARTMENT_TYPE_FLAT,
  APARTMENT_TYPE_GROUND,
  APARTMENT_TYPE_ROOF,
  APARTMENT_TYPE_MAISONETTE,
  APARTMENT_TYPE_LOFT,
  APARTMENT_TYPE_SOCIAL,
  APARTMENT_TYPE_SOUTERRAIN,
  APARTMENT_TYPE_PENTHOUSE,

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

  OCCUPATION_TYPE_OCCUPIED_OWN,
  OCCUPATION_TYPE_OCCUPIED_TENANT,
  OCCUPATION_TYPE_WRITE_OFF,
  OCCUPATION_TYPE_VACANCY,
  OCCUPATION_TYPE_NOT_RENT,
  OCCUPATION_TYPE_NOT_OCCUPIED,

  OWNERSHIP_TYPE_FREEHOLDER,
  OWNERSHIP_TYPE_DIRECT_PROPERTY,
  OWNERSHIP_TYPE_LEASEHOLD,
  OWNERSHIP_TYPE_OTHER,

  MARKETING_TYPE_PURCHASE,
  MARKETING_TYPE_RENT_LEASE,
  MARKETING_TYPE_LEASEHOLD,
  MARKETING_TYPE_LEASING,

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

  USE_TYPE_RESIDENTIAL,
  USE_TYPE_COMMERCIAL,
  USE_TYPE_CONSTRUCT,
  USE_TYPE_WAZ,
  USE_TYPE_PLANT,
  USE_TYPE_OTHER,

  HEATING_TYPE_NO,
  HEATING_TYPE_OVEN,
  HEATING_TYPE_FLOOR,
  HEATING_TYPE_CENTRAL,
  HEATING_TYPE_REMOTE,

  EQUIPMENT_STANDARD_SIMPLE,
  EQUIPMENT_STANDARD_NORMAL,
  EQUIPMENT_STANDARD_ENHANCED,

  PARKING_SPACE_TYPE_NO_PARKING,
  PARKING_SPACE_TYPE_UNDERGROUND,
  PARKING_SPACE_TYPE_CARPORT,
  PARKING_SPACE_TYPE_OUTDOOR,
  PARKING_SPACE_TYPE_CAR_PARK,
  PARKING_SPACE_TYPE_DUPLEX,
  PARKING_SPACE_TYPE_GARAGE,

  ROOM_TYPE_GUEST_ROOM,
  ROOM_TYPE_BEDROOM,
  ROOM_TYPE_KITCHEN,
  ROOM_TYPE_BATH,
  ROOM_TYPE_CHILDRENS_ROOM,
  ROOM_TYPE_CORRIDOR,
  ROOM_TYPE_WC,
  ROOM_TYPE_BALCONY,
  ROOM_TYPE_PANTRY,
  ROOM_TYPE_OTHER_SPACE,
  ROOM_TYPE_OFFICE,
  ROOM_TYPE_GARDEN,
  ROOM_TYPE_LOGGIA,
  ROOM_TYPE_CHECKROOM,
  ROOM_TYPE_DINING_ROOM,
  ROOM_TYPE_ENTRANCE_HALL,
  ROOM_TYPE_GYM,
  ROOM_TYPE_IRONING_ROOM,
  ROOM_TYPE_LIVING_ROOM,
  ROOM_TYPE_LOBBY,
  ROOM_TYPE_MASSAGE_ROOM,
  ROOM_TYPE_STORAGE_ROOM,
  ROOM_TYPE_PLACE_FOR_GAMES,
  ROOM_TYPE_SAUNA,
  ROOM_TYPE_SHOWER,
  ROOM_TYPE_STAFF_ROOM,
  ROOM_TYPE_SWIMMING_POOL,
  ROOM_TYPE_TECHNICAL_ROOM,
  ROOM_TYPE_TERRACE,
  ROOM_TYPE_WASHING_ROOM,
  ROOM_TYPE_EXTERNAL_CORRIDOR,
  ROOM_TYPE_STAIRS,
  ROOM_TYPE_PROPERTY_ENTRANCE,

  FAMILY_STATUS_NO_CHILD,
  FAMILY_STATUS_WITH_CHILD,
  FAMILY_STATUS_SINGLE,

  KIDS_NO_KIDS,
  KIDS_TO_5,
  KIDS_UP_5,

  LETTING_TYPE_LET,
  LETTING_TYPE_VOID,
  LETTING_TYPE_NA,

  LETTING_STATUS_STANDARD,
  LETTING_STATUS_TERMINATED,
  LETTING_STATUS_VACANCY,
  ESTATE_FLOOR_DIRECTION_LEFT,
  ESTATE_FLOOR_DIRECTION_RIGHT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT,
  ESTATE_FLOOR_DIRECTION_NA,
  ESTATE_FLOOR_DIRECTION_STRAIGHT_LEFT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT_RIGHT,
  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_NEUTRAL,
  GENDER_ANY,
  LETTING_STATUS_NEW_RENOVATED,
  MAX_MINOR_COUNT,
} = require('../constants')

const {
  exceptions: { SETTINGS_ERROR },
} = require('../exceptions')

extractValue = (key, value) => {
  const values = AVAILABLE_LANGUAGES.map((lang) => escapeStr(l.get(key, lang)))
  const filterValues = values.filter((v) => escapeStr(v) === escapeStr(value))
  if (filterValues && filterValues.length) {
    return filterValues[0]
  }
  return null
}

escapeStr = (v) => {
  return (v || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-zà-ž\u0370-\u03FF\u0400-\u04FF]/g, '_')
}

// items to percent
toPercent = (i) => {
  i = trim(i)
  if (i.includes('%')) {
    i = i.replace('%', '')
  }
  if (isNaN(parseFloat(i))) {
    i = NULL
  } else {
    i = parseFloat(i) * 100
  }

  return i
}

toBool = (v) => {
  switch (escapeStr(v)) {
    case 'no':
    case 'nein':
      return false
    case 'yes':
    case 'ja':
      return true
    default:
      return null
  }
}

reverseBool = (value) => {
  switch (value) {
    case true:
      return l.get('yes.message', this.lang)
    case false:
      return l.get('no.message', this.lang)
    default:
      return ''
  }
}

extractDate = (date) => {
  if (isEmpty(date)) {
    return null
  } else if (
    typeof date == 'string' &&
    (match = date.match(/^([0-9]{2})\.([0-9]{2})\.([0-9]{4})/))
  ) {
    return `${match[3]}-${match[2]}-${match[1]}`
  }
  return date
}

reverseExtractDate = (date) => {
  if (
    typeof date == 'string' &&
    (match = date.match(/^([0-9]{4})\-([0-9]{2})\-([0-9]{2})/)) &&
    this.lang === 'de'
  ) {
    return `${match[2]}.${match[1]}-${match[3]}`
  }
  return date
}

class EstateAttributeTranslations {
  reverseDataMapping = {
    non_smoker: reverseBool,
    rent_arrears: reverseBool,
    furnished: reverseBool,
    available_date: reverseExtractDate,
    from_date: reverseExtractDate,
    last_modernization: reverseExtractDate,
    contract_end: reverseExtractDate,
  }
  dataMapping = {
    property_type: {
      apartment: PROPERTY_TYPE_APARTMENT,
      Room: PROPERTY_TYPE_ROOM,
      House: PROPERTY_TYPE_HOUSE,
      Site: PROPERTY_TYPE_SITE,
      Office: PROPERTY_TYPE_OFFICE,
    },
    apt_type: {
      flat: APARTMENT_TYPE_FLAT,
      ground_floor: APARTMENT_TYPE_GROUND,
      roof_floor: APARTMENT_TYPE_ROOF,
      maisonette: APARTMENT_TYPE_MAISONETTE,
      loft_studio_atelier: APARTMENT_TYPE_LOFT,
      social: APARTMENT_TYPE_SOCIAL,
      souterrain: APARTMENT_TYPE_SOUTERRAIN,
      penthouse: APARTMENT_TYPE_PENTHOUSE,
    },
    // Building type
    house_type: {
      multi_family_house: HOUSE_TYPE_MULTIFAMILY_HOUSE,
      high_rise: HOUSE_TYPE_HIGH_RISE,
      series: HOUSE_TYPE_SERIES,
      semidetached_house: HOUSE_TYPE_SEMIDETACHED_HOUSE,
      two_family_house: HOUSE_TYPE_2FAMILY_HOUSE,
      detached_house: HOUSE_TYPE_DETACHED_HOUSE,
      country: HOUSE_TYPE_COUNTRY,
      bungalow: HOUSE_TYPE_BUNGALOW,
      villa: HOUSE_TYPE_VILLA,
      gardenhouse: HOUSE_TYPE_GARDENHOUSE,
    },
    use_type: {
      residential: USE_TYPE_RESIDENTIAL,
      commercial: USE_TYPE_COMMERCIAL,
      construct: USE_TYPE_CONSTRUCT,
      waz: USE_TYPE_WAZ,
    },
    occupancy: {
      occupied_own: OCCUPATION_TYPE_OCCUPIED_OWN,
      occupied_tenant: OCCUPATION_TYPE_OCCUPIED_TENANT,
      write_off: OCCUPATION_TYPE_WRITE_OFF,
      vacancy: OCCUPATION_TYPE_VACANCY,
      not_rent: OCCUPATION_TYPE_NOT_RENT,
      not_occupied: OCCUPATION_TYPE_NOT_OCCUPIED,
    },
    ownership_type: {
      freeholder: OWNERSHIP_TYPE_FREEHOLDER,
      direct_property: OWNERSHIP_TYPE_DIRECT_PROPERTY,
      leasehold: OWNERSHIP_TYPE_LEASEHOLD,
      other: OWNERSHIP_TYPE_OTHER,
    },
    marketing_type: {
      purchase: MARKETING_TYPE_PURCHASE,
      rent_lease: MARKETING_TYPE_RENT_LEASE,
      leasehold: MARKETING_TYPE_LEASEHOLD,
      leasing: MARKETING_TYPE_LEASING,
    },
    building_status: {
      first_time_occupied: BUILDING_STATUS_FIRST_TIME_OCCUPIED,
      part_complete_renovation_need: BUILDING_STATUS_PART_COMPLETE_RENOVATION_NEED,
      new: BUILDING_STATUS_NEW,
      existing: BUILDING_STATUS_EXISTING,
      part_fully_renovated: BUILDING_STATUS_PART_FULLY_RENOVATED,
      partly_refurished: BUILDING_STATUS_PARTLY_REFURISHED,
      in_need_of_renovation: BUILDING_STATUS_IN_NEED_OF_RENOVATION,
      ready_to_be_built: BUILDING_STATUS_READY_TO_BE_BUILT,
      by_agreement: BUILDING_STATUS_BY_AGREEMENT,
      modernized: BUILDING_STATUS_MODERNIZED,
      cleaned: BUILDING_STATUS_CLEANED,
      rough_building: BUILDING_STATUS_ROUGH_BUILDING,
      developed: BUILDING_STATUS_DEVELOPED,
      abrissobjekt: BUILDING_STATUS_ABRISSOBJEKT,
      projected: BUILDING_STATUS_PROJECTED,
    },
    apartment_status: {
      first_time_occupied: BUILDING_STATUS_FIRST_TIME_OCCUPIED,
      part_complete_renovation_need: BUILDING_STATUS_PART_COMPLETE_RENOVATION_NEED,
      new: BUILDING_STATUS_NEW,
      existing: BUILDING_STATUS_EXISTING,
      part_fully_renovated: BUILDING_STATUS_PART_FULLY_RENOVATED,
      partly_refurished: BUILDING_STATUS_PARTLY_REFURISHED,
      in_need_of_renovation: BUILDING_STATUS_IN_NEED_OF_RENOVATION,
      ready_to_be_built: BUILDING_STATUS_READY_TO_BE_BUILT,
      by_agreement: BUILDING_STATUS_BY_AGREEMENT,
      modernized: BUILDING_STATUS_MODERNIZED,
      cleaned: BUILDING_STATUS_CLEANED,
      rough_building: BUILDING_STATUS_ROUGH_BUILDING,
      developed: BUILDING_STATUS_DEVELOPED,
      abrissobjekt: BUILDING_STATUS_ABRISSOBJEKT,
      projected: BUILDING_STATUS_PROJECTED,
    },
    firing: {
      oel: FIRING_OEL,
      gas: FIRING_GAS,
      electric: FIRING_ELECTRIC,
      alternative: FIRING_ALTERNATIVE,
      solar: FIRING_SOLAR,
      ground_heat: FIRING_GROUND_HEAT,
      airwp: FIRING_AIRWP,
      district_heating: FIRING_REMOTE,
      block: FIRING_BLOCK,
      water_electric: FIRING_WATER_ELECTRIC,
      pellet: FIRING_PELLET,
      coal: FIRING_COAL,
      wood: FIRING_WOOD,
      liquid_gas: FIRING_LIQUID_GAS,
    },
    heating_type: {
      no_heating: HEATING_TYPE_NO,
      central: HEATING_TYPE_CENTRAL,
      floor: HEATING_TYPE_FLOOR,
      remote: HEATING_TYPE_REMOTE,
      oven: HEATING_TYPE_OVEN,
    },
    equipment_standard: {
      simple: EQUIPMENT_STANDARD_SIMPLE,
      normal: EQUIPMENT_STANDARD_NORMAL,
      enhanced: EQUIPMENT_STANDARD_ENHANCED,
    },
    parking_space_type: {
      no_parking: PARKING_SPACE_TYPE_NO_PARKING,
      underground: PARKING_SPACE_TYPE_UNDERGROUND,
      carport: PARKING_SPACE_TYPE_CARPORT,
      outdoor: PARKING_SPACE_TYPE_OUTDOOR,
      car_park: PARKING_SPACE_TYPE_CAR_PARK,
      duplex: PARKING_SPACE_TYPE_DUPLEX,
      garage: PARKING_SPACE_TYPE_GARAGE,
    },
    room_type: {
      guest_room: ROOM_TYPE_GUEST_ROOM,
      bedroom: ROOM_TYPE_BEDROOM,
      kitchen: ROOM_TYPE_KITCHEN,
      bath: ROOM_TYPE_BATH,
      children_room: ROOM_TYPE_CHILDRENS_ROOM,
      corridor: ROOM_TYPE_CORRIDOR,
      wc: ROOM_TYPE_WC,
      balcony: ROOM_TYPE_BALCONY,
      pantry: ROOM_TYPE_PANTRY,
      other_space: ROOM_TYPE_OTHER_SPACE,
      office: ROOM_TYPE_OFFICE,
      garden: ROOM_TYPE_GARDEN,
      loggia: ROOM_TYPE_LOGGIA,
      checkroom: ROOM_TYPE_CHECKROOM,
      dining_room: ROOM_TYPE_DINING_ROOM,
      entrance_hall: ROOM_TYPE_ENTRANCE_HALL,
      gym: ROOM_TYPE_GYM,
      ironing_room: ROOM_TYPE_IRONING_ROOM,
      living_room: ROOM_TYPE_LIVING_ROOM,
      lobby: ROOM_TYPE_LOBBY,
      massage_room: ROOM_TYPE_MASSAGE_ROOM,
      storage_room: ROOM_TYPE_STORAGE_ROOM,
      place_for_games: ROOM_TYPE_PLACE_FOR_GAMES,
      sauna: ROOM_TYPE_SAUNA,
      shower: ROOM_TYPE_SHOWER,
      staff_room: ROOM_TYPE_STAFF_ROOM,
      swimming_pool: ROOM_TYPE_SWIMMING_POOL,
      technical_room: ROOM_TYPE_TECHNICAL_ROOM,
      terrace: ROOM_TYPE_TERRACE,
      washing_room: ROOM_TYPE_WASHING_ROOM,
      external_corridor: ROOM_TYPE_EXTERNAL_CORRIDOR,
      stairs: ROOM_TYPE_STAIRS,
      property_entrance: ROOM_TYPE_PROPERTY_ENTRANCE,
    },
    family_status: {
      family_no_kids: FAMILY_STATUS_NO_CHILD,
      family_with_kids: FAMILY_STATUS_WITH_CHILD,
      single: FAMILY_STATUS_SINGLE,
    },
    kids_type: (i) => ((parseInt(i) || 0) > MAX_MINOR_COUNT ? MAX_MINOR_COUNT : parseInt(i) || 0),
    non_smoker: toBool,
    rent_arrears: toBool,
    furnished: toBool,
    available_date: extractDate,
    from_date: extractDate,
    last_modernization: extractDate,
    contract_end: extractDate,
    pets_allowed: {
      PETS_NO: 1,
      PETS_SMALL: 2,
      PETS_ANY: null,
      PETS_BIG: 3,
    },
    stp_garage: (i) => parseInt(i) || 0,
    budget: toPercent,
    credit_score: toPercent,
    deposit: (i, o) => parseInt(i) || 0, //* (parseFloat(o.net_rent) || 0), we need to parse deposit later
    number_floors: (i) => parseInt(i) || 1,
    floor: (i) => {
      switch (escapeStr(i)) {
        case extractValue(`property.attribute.APARTMENT_TYPE.Ground_floor.message`, escapeStr(i)): //'Ground floor':
          return 0
        case extractValue(`apt_roof_floor.message`, escapeStr(i)): //'Root floor':
          return 21
        default:
          return parseInt(i) || null
      }
    },
    family_size_max: (i) => {
      i = i.toString()
      return isEmpty(i) ? null : parseInt(i)
    },
    construction_year: (i) => {
      i = i.toString()
      return isEmpty(i) ? null : i
    },
    address: (i, o) => {
      return trim(
        `${o.street || ''} ${o.house_number || ''}, ${o.zip || ''} ${o.city || ''}`,
        ', '
      ).replace(/\s,/g, ',')
    },
    energy_efficiency: (i) => {
      return Number(i) === 0 ? null : Number(i)
    },
    area: (i) => Number(i),
    rooms_number: (i) => Number(i),
    net_rent: (i) => Number(i),
    additional_costs: (i) => Number(i),
    heating_costs: (i) => Number(i),
    min_age: (i) => parseInt(i) || 0,
    max_age: (i) => parseInt(i) || 0,
    currency: (i) => (isEmpty(i) ? 'EUR' : i),
    property_id: (i) => {
      if (i === undefined) {
        return Math.random().toString(36).substr(2, 8).toUpperCase()
      }
      return i
    },
  }

  constructor(lang = 'en') {
    this.setLang(lang)
    let dataMap = {
      property_type: {
        keys: [
          'property.attribute.PROPERTY_TYPE.Apartment.message',
          'property.attribute.PROPERTY_TYPE.Room.message',
          'property.attribute.PROPERTY_TYPE.House.message',
          'property.attribute.PROPERTY_TYPE.Site.message',
          'property.attribute.PROPERTY_TYPE.Office.message',
        ],
        values: [
          PROPERTY_TYPE_APARTMENT,
          PROPERTY_TYPE_ROOM,
          PROPERTY_TYPE_HOUSE,
          PROPERTY_TYPE_SITE,
          PROPERTY_TYPE_OFFICE,
        ],
      },
      apt_type: {
        keys: [
          'property.attribute.APARTMENT_TYPE.Flat.message',
          'property.attribute.APARTMENT_TYPE.Ground_floor.message',
          'property.attribute.APARTMENT_TYPE.Roof_floor.message',
          'property.attribute.APARTMENT_TYPE.Maisonette.message',
          'property.attribute.APARTMENT_TYPE.Loft_studio_atelier.message',
          'property.attribute.APARTMENT_TYPE.Social.message',
          'property.attribute.APARTMENT_TYPE.Souterrain.message',
          'property.attribute.APARTMENT_TYPE.Penthouse.message',
        ],
        values: [
          APARTMENT_TYPE_FLAT,
          APARTMENT_TYPE_GROUND,
          APARTMENT_TYPE_ROOF,
          APARTMENT_TYPE_MAISONETTE,
          APARTMENT_TYPE_LOFT,
          APARTMENT_TYPE_SOCIAL,
          APARTMENT_TYPE_SOUTERRAIN,
          APARTMENT_TYPE_PENTHOUSE,
        ],
      },
      house_type: {
        keys: [
          'property.attribute.HOUSE_TYPE.Multi-family_house.message',
          'property.attribute.HOUSE_TYPE.High_rise.message',
          'property.attribute.HOUSE_TYPE.Series.message',
          'property.attribute.HOUSE_TYPE.Semidetached_house.message',
          'property.attribute.HOUSE_TYPE.Two_family_house.message',
          'property.attribute.HOUSE_TYPE.Detached_house.message',
          'property.attribute.HOUSE_TYPE.Country.message',
          'property.attribute.HOUSE_TYPE.Bungalow.message',
          'property.attribute.HOUSE_TYPE.Villa.message',
          'property.attribute.HOUSE_TYPE.Gardenhouse.message',
        ],
        values: [
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
        ],
      },
      use_type: {
        keys: [
          'property.attribute.USE_TYPE.Residential.message',
          'property.attribute.USE_TYPE.Commercial.message',
          'property.attribute.USE_TYPE.Plant.message',
          'property.attribute.USE_TYPE.Other.message',
        ],
        values: [USE_TYPE_RESIDENTIAL, USE_TYPE_COMMERCIAL, USE_TYPE_PLANT, USE_TYPE_OTHER],
      },
      occupancy: {
        keys: [
          'property.attribute.OCCUPATION_TYPE.Private_Use.message',
          'property.attribute.OCCUPATION_TYPE.Occupied_by_tenant.message',
          'property.attribute.OCCUPATION_TYPE.Write_off.message',
          'property.attribute.OCCUPATION_TYPE.Vacancy.message',
          'property.attribute.OCCUPATION_TYPE.Not_rent_not_occupied.message',
          'property.attribute.OCCUPATION_TYPE.Rent_but_not_occupied.message',
        ],
        values: [
          OCCUPATION_TYPE_OCCUPIED_OWN,
          OCCUPATION_TYPE_OCCUPIED_TENANT,
          OCCUPATION_TYPE_WRITE_OFF,
          OCCUPATION_TYPE_VACANCY,
          OCCUPATION_TYPE_NOT_RENT,
          OCCUPATION_TYPE_NOT_OCCUPIED,
        ],
      },
      ownership_type: {
        keys: [
          'property.attribute.OWNERSHIP_TYPE.Freeholder.message',
          'property.attribute.OWNERSHIP_TYPE.Direct_property.message',
          'property.attribute.OWNERSHIP_TYPE.Leasehold.message',
          'property.attribute.OWNERSHIP_TYPE.Other.message',
        ],
        values: [
          OWNERSHIP_TYPE_FREEHOLDER,
          OWNERSHIP_TYPE_DIRECT_PROPERTY,
          OWNERSHIP_TYPE_LEASEHOLD,
          OWNERSHIP_TYPE_OTHER,
        ],
      },
      marketing_type: {
        keys: [
          'property.attribute.DEAL_TYPE.Purchase.message',
          'property.attribute.DEAL_TYPE.Rent_lease.message',
          'property.attribute.DEAL_TYPE.Leasehold.message',
          'property.attribute.DEAL_TYPE.Leasing.message',
        ],
        values: [
          MARKETING_TYPE_PURCHASE,
          MARKETING_TYPE_RENT_LEASE,
          MARKETING_TYPE_LEASEHOLD,
          MARKETING_TYPE_LEASING,
        ],
      },
      building_status: {
        keys: [
          'property.attribute.BUILDING_STATUS.First_time_occupied.message',
          'property.attribute.BUILDING_STATUS.Part_complete_renovation_need.message',
          'property.attribute.BUILDING_STATUS.New.message',
          'property.attribute.BUILDING_STATUS.Existing.message',
          'property.attribute.BUILDING_STATUS.Part_fully_renovated.message',
          'property.attribute.BUILDING_STATUS.Partly_refurished.message',
          'property.attribute.BUILDING_STATUS.In_need_of_renovation.message',
          'property.attribute.BUILDING_STATUS.Ready_to_be_built.message',
          'property.attribute.BUILDING_STATUS.By_agreement.message',
          'property.attribute.BUILDING_STATUS.Modernized.message',
          'property.attribute.BUILDING_STATUS.Cleaned.message',
          'property.attribute.BUILDING_STATUS.Rough_building.message',
          'property.attribute.BUILDING_STATUS.Developed.message',
          'property.attribute.BUILDING_STATUS.Abrissobjekt.message',
          'property.attribute.BUILDING_STATUS.Projected.message',
        ],
        values: [
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
        ],
      },
      apartment_status: {
        keys: [
          'property.attribute.BUILDING_STATUS.First_time_occupied.message',
          'property.attribute.BUILDING_STATUS.Part_complete_renovation_need.message',
          'property.attribute.BUILDING_STATUS.New.message',
          'property.attribute.BUILDING_STATUS.Existing.message',
          'property.attribute.BUILDING_STATUS.Part_fully_renovated.message',
          'property.attribute.BUILDING_STATUS.Partly_refurished.message',
          'property.attribute.BUILDING_STATUS.In_need_of_renovation.message',
          'property.attribute.BUILDING_STATUS.Ready_to_be_built.message',
          'property.attribute.BUILDING_STATUS.By_agreement.message',
          'property.attribute.BUILDING_STATUS.Modernized.message',
          'property.attribute.BUILDING_STATUS.Cleaned.message',
          'property.attribute.BUILDING_STATUS.Rough_building.message',
          'property.attribute.BUILDING_STATUS.Developed.message',
          'property.attribute.BUILDING_STATUS.Abrissobjekt.message',
          'property.attribute.BUILDING_STATUS.Projected.message',
        ],
        values: [
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
        ],
      },
      firing: {
        keys: [
          'property.attribute.FIRING.Oel.message',
          'property.attribute.FIRING.Gas.message',
          'property.attribute.FIRING.Electric.message',
          'property.attribute.FIRING.Alternative.message',
          'property.attribute.FIRING.Solar.message',
          'property.attribute.FIRING.Ground_heat.message',
          'property.attribute.FIRING.Airwp.message',
          'property.attribute.FIRING.District_heating.message',
          'property.attribute.FIRING.Block.message',
          'property.attribute.FIRING.Water_electric.message',
          'property.attribute.FIRING.Pellet.message',
          'property.attribute.FIRING.Coal.message',
          'property.attribute.FIRING.Wood.message',
          'property.attribute.FIRING.Liquid_gas.message',
        ],
        values: [
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
        ],
      },
      heating_type: {
        keys: [
          'property.attribute.HEATING_TYPE.Central.message',
          'property.attribute.HEATING_TYPE.Floor.message',
          'property.attribute.HEATING_TYPE.Remote.message',
          'property.attribute.HEATING_TYPE.Oven.message',
        ],
        values: [HEATING_TYPE_CENTRAL, HEATING_TYPE_FLOOR, HEATING_TYPE_REMOTE, HEATING_TYPE_OVEN],
      },
      equipment_standard: {
        keys: [
          'property.attribute.EQUIPMENT_STANDARD.Simple.message',
          'property.attribute.EQUIPMENT_STANDARD.Normal.message',
          'property.attribute.EQUIPMENT_STANDARD.Enhanced.message',
        ],
        values: [EQUIPMENT_STANDARD_SIMPLE, EQUIPMENT_STANDARD_NORMAL, EQUIPMENT_STANDARD_ENHANCED],
      },
      parking_space_type: {
        keys: [
          'web.letting.property.import.No_Parking.message',
          'property.attribute.PARKING_SPACE_TYPE.Underground.message',
          'property.attribute.PARKING_SPACE_TYPE.Carport.message',
          'property.attribute.PARKING_SPACE_TYPE.Outdoor.message',
          'property.attribute.PARKING_SPACE_TYPE.Car_park.message',
          'property.attribute.PARKING_SPACE_TYPE.Duplex.message',
          'property.attribute.PARKING_SPACE_TYPE.Garage.message',
        ],
        values: [
          PARKING_SPACE_TYPE_NO_PARKING,
          PARKING_SPACE_TYPE_UNDERGROUND,
          PARKING_SPACE_TYPE_CARPORT,
          PARKING_SPACE_TYPE_OUTDOOR,
          PARKING_SPACE_TYPE_CAR_PARK,
          PARKING_SPACE_TYPE_DUPLEX,
          PARKING_SPACE_TYPE_GARAGE,
        ],
      },
      room_type: {
        keys: [
          'apartment.amenities.room_type.living_room.message',
          'landlord.property.inside_view.rooms.guest_room.message',
          'landlord.property.inside_view.rooms.stairs.message',
          'apartment.amenities.room_type.bedroom.message',
          'apartment.amenities.room_type.kitchen.message',
          'apartment.amenities.room_type.bath.message',
          "apartment.amenities.room_type.children's_room.message",
          'landlord.property.inside_view.rooms.corridor.message',
          'landlord.property.inside_view.rooms.wc.message',
          'apartment.amenities.room_type.balcony.message',
          'apartment.amenities.room_type.pantry.message',
          'landlord.property.inside_view.rooms.other_space.message',
          'landlord.property.inside_view.rooms.office.message',
          'landlord.property.inside_view.rooms.garden.message',
          'landlord.property.inside_view.rooms.loggia.message',
          'landlord.property.inside_view.rooms.checkroom.message',
          'apartment.amenities.room_type.dining_room.message',
          'apartment.amenities.room_type.entrance_hall.message',
          'apartment.amenities.room_type.gym.message',
          'landlord.property.inside_view.rooms.ironing_room.message',
          'landlord.property.inside_view.rooms.staff_room.message',
          'apartment.amenities.room_type.lobby.message',
          'apartment.amenities.room_type.massage_room.message',
          'room_storage_room.message',
          'apartment.amenities.room_type.place_for_games.message',
          'apartment.amenities.room_type.sauna.message',
          'apartment.amenities.room_type.shower.message',
          'landlord.property.inside_view.rooms.property_entrance.message',
          'apartment.amenities.room_type.swimming_pool.message',
          'apartment.amenities.room_type.technical_room.message',
          'landlord.property.inside_view.rooms.terrace.message',
          'landlord.property.inside_view.rooms.washing_room.message',
          'landlord.property.inside_view.rooms.external_corridor.message',
        ],
        values: [
          ROOM_TYPE_LIVING_ROOM,
          ROOM_TYPE_GUEST_ROOM,
          ROOM_TYPE_STAIRS,
          ROOM_TYPE_BEDROOM,
          ROOM_TYPE_KITCHEN,
          ROOM_TYPE_BATH,
          ROOM_TYPE_CHILDRENS_ROOM,
          ROOM_TYPE_CORRIDOR,
          ROOM_TYPE_WC,
          ROOM_TYPE_BALCONY,
          ROOM_TYPE_PANTRY,
          ROOM_TYPE_OTHER_SPACE,
          ROOM_TYPE_OFFICE,
          ROOM_TYPE_GARDEN,
          ROOM_TYPE_LOGGIA,
          ROOM_TYPE_CHECKROOM,
          ROOM_TYPE_DINING_ROOM,
          ROOM_TYPE_ENTRANCE_HALL,
          ROOM_TYPE_GYM,
          ROOM_TYPE_IRONING_ROOM,
          ROOM_TYPE_STAFF_ROOM,
          ROOM_TYPE_LOBBY,
          ROOM_TYPE_MASSAGE_ROOM,
          ROOM_TYPE_STORAGE_ROOM,
          ROOM_TYPE_PLACE_FOR_GAMES,
          ROOM_TYPE_SAUNA,
          ROOM_TYPE_SHOWER,
          ROOM_TYPE_PROPERTY_ENTRANCE,
          ROOM_TYPE_SWIMMING_POOL,
          ROOM_TYPE_TECHNICAL_ROOM,
          ROOM_TYPE_TERRACE,
          ROOM_TYPE_WASHING_ROOM,
          ROOM_TYPE_EXTERNAL_CORRIDOR,
        ],
      },
      room_type_name: {
        keys: [
          'apartment.amenities.room_type.living_room.message',
          'landlord.property.inside_view.rooms.guest_room.message',
          'landlord.property.inside_view.rooms.stairs.message',
          'apartment.amenities.room_type.bedroom.message',
          'apartment.amenities.room_type.kitchen.message',
          'apartment.amenities.room_type.bath.message',
          "apartment.amenities.room_type.children's_room.message",
          'landlord.property.inside_view.rooms.corridor.message',
          'landlord.property.inside_view.rooms.wc.message',
          'apartment.amenities.room_type.balcony.message',
          'apartment.amenities.room_type.pantry.message',
          'landlord.property.inside_view.rooms.other_space.message',
          'landlord.property.inside_view.rooms.office.message',
          'landlord.property.inside_view.rooms.garden.message',
          'landlord.property.inside_view.rooms.loggia.message',
          'landlord.property.inside_view.rooms.checkroom.message',
          'apartment.amenities.room_type.dining_room.message',
          'apartment.amenities.room_type.entrance_hall.message',
          'apartment.amenities.room_type.gym.message',
          'landlord.property.inside_view.rooms.ironing_room.message',
          'landlord.property.inside_view.rooms.staff_room.message',
          'apartment.amenities.room_type.lobby.message',
          'apartment.amenities.room_type.massage_room.message',
          'room_storage_room.message',
          'apartment.amenities.room_type.place_for_games.message',
          'apartment.amenities.room_type.sauna.message',
          'apartment.amenities.room_type.shower.message',
          'landlord.property.inside_view.rooms.property_entrance.message',
          'apartment.amenities.room_type.swimming_pool.message',
          'apartment.amenities.room_type.technical_room.message',
          'landlord.property.inside_view.rooms.terrace.message',
          'landlord.property.inside_view.rooms.washing_room.message',
          'landlord.property.inside_view.rooms.external_corridor.message',
        ],
        values: [
          'apartment.amenities.room_type.living_room',
          'landlord.property.inside_view.rooms.guest_room',
          'landlord.property.inside_view.rooms.stairs',
          'apartment.amenities.room_type.bedroom',
          'apartment.amenities.room_type.kitchen',
          'apartment.amenities.room_type.bath',
          "apartment.amenities.room_type.children's_room",
          'landlord.property.inside_view.rooms.corridor',
          'landlord.property.inside_view.rooms.wc',
          'apartment.amenities.room_type.balcony',
          'apartment.amenities.room_type.pantry',
          'landlord.property.inside_view.rooms.other_space',
          'landlord.property.inside_view.rooms.office',
          'landlord.property.inside_view.rooms.garden',
          'landlord.property.inside_view.rooms.loggia',
          'landlord.property.inside_view.rooms.checkroom',
          'apartment.amenities.room_type.dining_room',
          'apartment.amenities.room_type.entrance_hall',
          'apartment.amenities.room_type.gym',
          'landlord.property.inside_view.rooms.ironing_room',
          'landlord.property.inside_view.rooms.staff_room',
          'apartment.amenities.room_type.lobby',
          'apartment.amenities.room_type.massage_room',
          'room_storage_room',
          'apartment.amenities.room_type.place_for_games',
          'apartment.amenities.room_type.sauna',
          'apartment.amenities.room_type.shower',
          'landlord.property.inside_view.rooms.property_entrance',
          'apartment.amenities.room_type.swimming_pool',
          'apartment.amenities.room_type.technical_room',
          'landlord.property.inside_view.rooms.terrace',
          'landlord.property.inside_view.rooms.washing_room',
          'landlord.property.inside_view.rooms.external_corridor',
        ],
      },
      pets_allowed: {
        keys: ['yes.message', 'web.letting.property.import.No_or_small_pets.message'],
        values: [true, false],
      },
      minors: {
        keys: ['web.letting.property.import.No_matter.message', 'yes.message'],
        values: [false, true],
      },
      let_type: {
        keys: [
          'property.attribute.LETTING_TYPE.Let.message',
          'property.attribute.LETTING_TYPE.Void.message',
          'property.attribute.LETTING_TYPE.NA.message',
        ],
        values: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      },
      let_status: {
        keys: [
          'property.attribute.LETTING_STATUS.Normal.message',
          'property.attribute.LETTING_STATUS.Terminated.message',
          'property.attribute.LETTING_STATUS.Vacancy.message',
          'property.attribute.LETTING_STATUS.new_renovated.message',
        ],
        values: [
          LETTING_STATUS_STANDARD,
          LETTING_STATUS_TERMINATED,
          LETTING_STATUS_VACANCY,
          LETTING_STATUS_NEW_RENOVATED,
        ],
      },
      salutation: {
        keys: [
          'landlord.profile.user_details.salut.mr.message',
          'landlord.profile.user_details.salut.ms.message',
          'landlord.profile.user_details.salut.not_def.message',
          'landlord.profile.user_details.salut.sir_madam.message',
        ],
        values: [GENDER_MALE, GENDER_FEMALE, GENDER_ANY, GENDER_NEUTRAL],
      },
      floor_direction: {
        keys: [
          'property.attribute.LETTING_TYPE.NA.message',
          'property.attribute.floor_direction.left.message',
          'property.attribute.floor_direction.right.message',
          'property.attribute.floor_direction.straight.message',
          'property.attribute.floor_direction.straight.left.message',
          'property.attribute.floor_direction.straight.right.message',
        ],
        values: [
          ESTATE_FLOOR_DIRECTION_NA,
          ESTATE_FLOOR_DIRECTION_LEFT,
          ESTATE_FLOOR_DIRECTION_RIGHT,
          ESTATE_FLOOR_DIRECTION_STRAIGHT,
          ESTATE_FLOOR_DIRECTION_STRAIGHT_LEFT,
          ESTATE_FLOOR_DIRECTION_STRAIGHT_RIGHT,
        ],
      },
    }
    this.dataMap = dataMap
  }

  setLang(lang) {
    this.lang = lang
  }

  getMap() {
    const dataMap = this.dataMap
    let keyValue
    for (let attribute in dataMap) {
      keyValue = {}
      if (dataMap[attribute].keys.length !== dataMap[attribute].values.length) {
        throw new HttpException(SETTINGS_ERROR, 500, 110198)
      }
      for (let k = 0; k < dataMap[attribute].keys.length; k++) {
        AVAILABLE_LANGUAGES.map((lang) => {
          keyValue[escapeStr(l.get(dataMap[attribute].keys[k], lang))] =
            dataMap[attribute].values[k]
        })
      }
      this.dataMapping[attribute] = keyValue
    }
    return this.dataMapping
  }

  /**
   * keys are numeric values are translations
   * @returns key value pair of reverse mapped attributes
   */
  getReverseDataMap() {
    const dataMap = this.dataMap
    let keyValue
    for (let attribute in dataMap) {
      keyValue = {}
      if (dataMap[attribute].keys.length !== dataMap[attribute].values.length) {
        throw new HttpException(SETTINGS_ERROR, 500, 110176)
      }
      for (let k = 0; k < dataMap[attribute].keys.length; k++) {
        keyValue[dataMap[attribute].values[k]] = l.get(dataMap[attribute].keys[k], this.lang)
      }
      this.reverseDataMapping[attribute] = keyValue
    }
    return this.reverseDataMapping
  }
}

module.exports = EstateAttributeTranslations
