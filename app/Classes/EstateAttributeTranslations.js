const l = use('Localize')
const HttpException = use('App/Exceptions/HttpException')
const { trim } = require('lodash')
const {
  PROPERTY_TYPE_APARTMENT,
  PROPERTY_TYPE_ROOM,
  PROPERTY_TYPE_HOUSE,
  PROPERTY_TYPE_SITE,

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

  HEATING_TYPE_NO,
  HEATING_TYPE_OVEN,
  HEATING_TYPE_FLOOR,
  HEATING_TYPE_CENTRAL,
  HEATING_TYPE_REMOTE,

  EQUIPMENT_STANDARD_SIMPLE,
  EQUIPMENT_STANDARD_NORMAL,
  EQUIPMENT_STANDARD_ENHANCED,

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

  ENERGY_TYPE_LOW_ENERGY,
  ENERGY_TYPE_PASSIVE_HOUSE,
  ENERGY_TYPE_NEW_BUILDING_STANDARD,
  ENERGY_TYPE_KFW40,
  ENERGY_TYPE_KFW60,
  ENERGY_TYPE_KFW55,
  ENERGY_TYPE_KFW70,
  ENERGY_TYPE_MINERGIE_CONSTRUCTION,
  ENERGY_TYPE_MINERGIE_CERTIFIED,
} = require('../constants')

escapeStr = (v) => {
  return (v || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-zà-ž\u0370-\u03FF\u0400-\u04FF]/g, '_')
}

// items to percent
toPercent = (i) => {
  return (parseFloat(i) || 0) * 100
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

extractDate = (date) => {
  if (typeof date == 'string' && (match = date.match(/^([0-9]{2})\.([0-9]{2})\.([0-9]{4})/))) {
    return `${match[3]}-${match[2]}-${match[1]}`
  }
  return date
}

class EstateAttributeTranslations {
  dataMapping = {
    property_type: {
      apartment: PROPERTY_TYPE_APARTMENT,
      Room: PROPERTY_TYPE_ROOM,
      House: PROPERTY_TYPE_HOUSE,
      Site: PROPERTY_TYPE_SITE,
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
      oven: HEATING_TYPE_OVEN,
      floor: HEATING_TYPE_FLOOR,
      central: HEATING_TYPE_CENTRAL,
      remote: HEATING_TYPE_REMOTE,
    },
    equipment_standard: {
      simple: EQUIPMENT_STANDARD_SIMPLE,
      normal: EQUIPMENT_STANDARD_NORMAL,
      enhanced: EQUIPMENT_STANDARD_ENHANCED,
    },
    parking_space_type: {
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
    kids_type: {
      no_kids: KIDS_NO_KIDS,
      to_5_year: KIDS_TO_5,
      up_5_year: KIDS_UP_5,
    },
    non_smoker: toBool,
    rent_arrears: toBool,
    furnished: toBool,
    available_date: extractDate,
    from_date: extractDate,
    last_modernization: extractDate,
    pets_allowed: {
      PETS_NO: 1,
      PETS_SMALL: 2,
      PETS_ANY: null,
      PETS_BIG: 3,
    },
    stp_garage: (i) => parseInt(i) || 0,
    budget: (i) => i * 100,
    deposit: (i, o) => (parseInt(i) || 0) * (parseFloat(o.net_rent) || 0),
    number_floors: (i) => parseInt(i) || 1,
    floor: (i) => {
      switch (i) {
        case 'Ground floor':
          return 0
        case 'Roof':
          return 21
        default:
          return parseInt(i)
      }
    },
    address: (i, o) => {
      return trim(
        `${o.street || ''} ${o.house_number || ''}, ${o.zip || ''} ${o.city || ''}`,
        ', '
      ).replace(/\s,/g, ',')
    },
    energy_efficiency: (i) => i,
  }

  constructor(lang = 'en') {
    let dataMap = {
      property_type: {
        keys: [
          l.get('property.attribute.PROPERTY_TYPE.Apartment.message', lang),
          l.get('property.attribute.PROPERTY_TYPE.Room.message', lang),
          l.get('property.attribute.PROPERTY_TYPE.House.message', lang),
          l.get('property.attribute.PROPERTY_TYPE.Site.message', lang),
        ],
        values: [
          PROPERTY_TYPE_APARTMENT,
          PROPERTY_TYPE_ROOM,
          PROPERTY_TYPE_HOUSE,
          PROPERTY_TYPE_SITE,
        ],
      },
      apt_type: {
        keys: [
          l.get('property.attribute.APARTMENT_TYPE.Flat.message', lang),
          l.get('property.attribute.APARTMENT_TYPE.Ground_floor.message', lang),
          l.get('property.attribute.APARTMENT_TYPE.Roof_floor.message', lang),
          l.get('property.attribute.APARTMENT_TYPE.Maisonette.message', lang),
          l.get('property.attribute.APARTMENT_TYPE.Loft_studio_atelier.message', lang),
          l.get('property.attribute.APARTMENT_TYPE.Social.message', lang),
          l.get('property.attribute.APARTMENT_TYPE.Souterrain.message', lang),
          l.get('property.attribute.APARTMENT_TYPE.Penthouse.message', lang),
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
          l.get('property.attribute.HOUSE_TYPE.Multi-family_house.message', lang),
          l.get('property.attribute.HOUSE_TYPE.High_rise.message', lang),
          l.get('property.attribute.HOUSE_TYPE.Series.message', lang),
          l.get('property.attribute.HOUSE_TYPE.Semidetached_house.message', lang),
          l.get('property.attribute.HOUSE_TYPE.Two_family_house.message', lang),
          l.get('property.attribute.HOUSE_TYPE.Detached_house.message', lang),
          l.get('property.attribute.HOUSE_TYPE.Country.message', lang),
          l.get('property.attribute.HOUSE_TYPE.Bungalow.message', lang),
          l.get('property.attribute.HOUSE_TYPE.Villa.message', lang),
          l.get('property.attribute.HOUSE_TYPE.Gardenhouse.message', lang),
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
          l.get('property.attribute.USE_TYPE.Residential.message', lang),
          l.get('property.attribute.USE_TYPE.Commercial.message', lang),
          l.get('property.attribute.USE_TYPE.Plant.message', lang),
          l.get('property.attribute.USE_TYPE.Other.message', lang),
        ],
        values: [USE_TYPE_RESIDENTIAL, USE_TYPE_COMMERCIAL, USE_TYPE_CONSTRUCT, USE_TYPE_WAZ],
      },
      occupancy: {
        keys: [
          l.get('property.attribute.OCCUPATION_TYPE.Private_Use.message', lang),
          l.get('property.attribute.OCCUPATION_TYPE.Occupied_by_tenant.message', lang),
          l.get('property.attribute.OCCUPATION_TYPE.Write_off.message', lang),
          l.get('property.attribute.OCCUPATION_TYPE.Vacancy.message', lang),
          l.get('property.attribute.OCCUPATION_TYPE.Not_rent_not_occupied.message', lang),
          l.get('property.attribute.OCCUPATION_TYPE.Rent_but_not_occupied.message', lang),
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
          l.get('property.attribute.USE_TYPE.Residential.message', lang),
          l.get('property.attribute.USE_TYPE.Commercial.message', lang),
          l.get('property.attribute.USE_TYPE.Plant.message', lang),
          l.get('property.attribute.USE_TYPE.Other.message', lang),
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
          l.get('property.attribute.DEAL_TYPE.Purchase.message', lang),
          l.get('property.attribute.DEAL_TYPE.Rent_lease.message', lang),
          l.get('property.attribute.DEAL_TYPE.Leasehold.message', lang),
          l.get('property.attribute.DEAL_TYPE.Leasing.message', lang),
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
          l.get('property.attribute.BUILDING_STATUS.First_time_occupied.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Part_complete_renovation_need.message', lang),
          l.get('property.attribute.BUILDING_STATUS.New.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Existing.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Part_fully_renovated.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Partly_refurished.message', lang),
          l.get('property.attribute.BUILDING_STATUS.In_need_of_renovation.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Ready_to_be_built.message', lang),
          l.get('property.attribute.BUILDING_STATUS.By_agreement.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Modernized.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Cleaned.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Rough_building.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Developed.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Abrissobjekt.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Projected.message', lang),
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
          l.get('property.attribute.BUILDING_STATUS.First_time_occupied.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Part_complete_renovation_need.message', lang),
          l.get('property.attribute.BUILDING_STATUS.New.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Existing.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Part_fully_renovated.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Partly_refurished.message', lang),
          l.get('property.attribute.BUILDING_STATUS.In_need_of_renovation.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Ready_to_be_built.message', lang),
          l.get('property.attribute.BUILDING_STATUS.By_agreement.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Modernized.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Cleaned.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Rough_building.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Developed.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Abrissobjekt.message', lang),
          l.get('property.attribute.BUILDING_STATUS.Projected.message', lang),
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
          l.get('property.attribute.FIRING.Oel.message', lang),
          l.get('property.attribute.FIRING.Gas.message', lang),
          l.get('property.attribute.FIRING.Electric.message', lang),
          l.get('property.attribute.FIRING.Alternative.message', lang),
          l.get('property.attribute.FIRING.Solar.message', lang),
          l.get('property.attribute.FIRING.Ground_heat.message', lang),
          l.get('property.attribute.FIRING.Airwp.message', lang),
          l.get('property.attribute.FIRING.District_heating.message', lang),
          l.get('property.attribute.FIRING.Block.message', lang),
          l.get('property.attribute.FIRING.Water_electric.message', lang),
          l.get('property.attribute.FIRING.Pellet.message', lang),
          l.get('property.attribute.FIRING.Coal.message', lang),
          l.get('property.attribute.FIRING.Wood.message', lang),
          l.get('property.attribute.FIRING.Liquid_gas.message', lang),
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
      //FIXME: not matching
      heating_type: {
        keys: [
          l.get('property.attribute.HEATING_TYPE.Floor_heating.message', lang),
          l.get('property.attribute.HEATING_TYPE.Oven.message', lang),
          l.get('property.attribute.HEATING_TYPE.Floor.message', lang),
          l.get('property.attribute.HEATING_TYPE.Central.message', lang),
          l.get('property.attribute.HEATING_TYPE.Remote.message', lang),
        ],
        values: [
          HEATING_TYPE_NO,
          HEATING_TYPE_OVEN,
          HEATING_TYPE_FLOOR,
          HEATING_TYPE_CENTRAL,
          HEATING_TYPE_REMOTE,
        ],
      },
      equipment_standard: {
        keys: [
          l.get('property.attribute.EQUIPMENT_STANDARD.Simple.message', lang),
          l.get('property.attribute.EQUIPMENT_STANDARD.Normal.message', lang),
          l.get('property.attribute.EQUIPMENT_STANDARD.Enhanced.message', lang),
        ],
        values: [EQUIPMENT_STANDARD_SIMPLE, EQUIPMENT_STANDARD_NORMAL, EQUIPMENT_STANDARD_ENHANCED],
      },
      parking_space_type: {
        keys: [
          l.get('property.attribute.PARKING_SPACE_TYPE.Underground.message', lang),
          l.get('property.attribute.PARKING_SPACE_TYPE.Carport.message', lang),
          l.get('property.attribute.PARKING_SPACE_TYPE.Outdoor.message', lang),
          l.get('property.attribute.PARKING_SPACE_TYPE.Car_park.message', lang),
          l.get('property.attribute.PARKING_SPACE_TYPE.Duplex.message', lang),
          l.get('property.attribute.PARKING_SPACE_TYPE.Garage.message', lang),
        ],
        values: [
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
          l.get('property.attribute.ROOM_TYPE.Guest_room.message', lang),
          l.get('property.attribute.ROOM_TYPE.Bedroom.message', lang),
          l.get('property.attribute.ROOM_TYPE.Kitchen.message', lang),
          l.get('property.attribute.ROOM_TYPE.Bath.message', lang),
          l.get('property.attribute.ROOM_TYPE.Children_room.message', lang),
          l.get('property.attribute.ROOM_TYPE.Corridor.message', lang),
          l.get('property.attribute.ROOM_TYPE.Wc.message', lang),
          l.get('property.attribute.ROOM_TYPE.Balcony.message', lang),
          l.get('property.attribute.ROOM_TYPE.Pantry.message', lang),
          l.get('property.attribute.ROOM_TYPE.Other_space.message', lang),
          l.get('property.attribute.ROOM_TYPE.Office.message', lang),
          l.get('property.attribute.ROOM_TYPE.Garden.message', lang),
          l.get('property.attribute.ROOM_TYPE.Loggia.message', lang),
          l.get('property.attribute.ROOM_TYPE.Checkroom.message', lang),
          l.get('property.attribute.ROOM_TYPE.Dining_room.message', lang),
          l.get('property.attribute.ROOM_TYPE.Entrance_hall.message', lang),
          l.get('property.attribute.ROOM_TYPE.Gym.message', lang),
          l.get('property.attribute.ROOM_TYPE.Ironing_room.message', lang),
          l.get('property.attribute.ROOM_TYPE.Living_room.message', lang),
          l.get('property.attribute.ROOM_TYPE.Lobby.message', lang),
          l.get('property.attribute.ROOM_TYPE.Massage_room.message', lang),
          l.get('property.attribute.ROOM_TYPE.Storage_room.message', lang),
          l.get('property.attribute.ROOM_TYPE.Place_for_games.message', lang),
          l.get('property.attribute.ROOM_TYPE.Sauna.message', lang),
          l.get('property.attribute.ROOM_TYPE.Shower.message', lang),
          l.get('property.attribute.ROOM_TYPE.Staff_room.message', lang),
          l.get('property.attribute.ROOM_TYPE.Swimming_pool.message', lang),
          l.get('property.attribute.ROOM_TYPE.Technical_room.message', lang),
          l.get('property.attribute.ROOM_TYPE.Terrace.message', lang),
          l.get('property.attribute.ROOM_TYPE.Washing_room.message', lang),
          l.get('property.attribute.ROOM_TYPE.External_corridor.message', lang),
          l.get('property.attribute.ROOM_TYPE.Stairs.message', lang),
          l.get('property.attribute.ROOM_TYPE.Property_entrance.message', lang),
        ],
        values: [
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
        ],
      },
      /*
      family_status: {
        keys: [

        ],
        values: [

        ]
        family_no_kids: FAMILY_STATUS_NO_CHILD,
        family_with_kids: FAMILY_STATUS_WITH_CHILD,
        single: FAMILY_STATUS_SINGLE,
      },*/
    }
    let keyValue
    for (let attribute in dataMap) {
      keyValue = {}
      for (let k = 0; k < dataMap[attribute].keys.length; k++) {
        keyValue[dataMap[attribute].keys[k]] = dataMap[attribute].values[k]
      }
      this.dataMapping[attribute] = keyValue
    }
    //console.log('dataMapping', this.dataMapping)
    //throw new HttpException('datamapping')
    return this.dataMapping
  }
}

module.exports = EstateAttributeTranslations
