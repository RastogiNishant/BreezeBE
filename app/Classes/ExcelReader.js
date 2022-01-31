const xlsx = require('node-xlsx')
const { get, has, trim, isEmpty, reduce, isString, isFunction } = require('lodash')
const AppException = use('App/Exceptions/AppException')
const schema = require('../Validators/CreateEstate').schema()

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
} = require('../constants')
const HttpException = use('App/Exceptions/HttpException')

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
      return false
    case 'yes':
      return true
    default:
      return null
  }
}

class ExcelReader {
  constructor() {
    this.headerCol = 4
    this.columns = [
      'No.',
      'Landlord email address',
      'Street',
      'House Number',
      'Extra Address',
      'Postcode',
      'City',
      'Country',
      'Property ID',
      'Property Type',
      'Apartment Type',
      'House Type',
      'Use Type',
      'occupancy',
      'Ownership Type',
      'Sale Type',
      'Net Rent',
      'Utility Costs',
      'Parking Rent',
      'Deposit',
      'Available from',
      'Visit from',
      'Currency',
      'Construction',
      'Last modernization',
      'Building Status',
      'Number of floors',
      'Energy Consumption Value',
      'Energy Carrier',
      'Heating Type',
      'Living Space',
      'Number_of_Rooms',
      'Floor',
      'Apartment Status',
      'Amenities Type',
      'Furnished',
      'Parking Space Type',
      'Room 1',
      'Tags 1',
      'Area 1',
      'Name 1',
      'Photos 1',
      'Room 2',
      'Tags 2',
      'Area 2',
      'Name 2',
      'Photos 2',
      'Room 3',
      'Tags 3',
      'Area 3',
      'Name 3',
      'Photos 3',
      'Room 4',
      'Tags 4',
      'Area 4',
      'Name 4',      
      'Photos 4',
      'Room 5',
      'Tags 5',
      'Area 5',
      'Name 5',      
      'Photos 5',
      'Room 6',
      'Tags 6',
      'Area 6',
      'Name 6',      
      'Photos 6',
      'Salary Burden',
      'Rent Arrears',
      'Credit Score',
      'Tenant Age Min',
      'Tenant Age Max',
      'Family Status',
      'Smoking Allowed',
      'Kids Allowed',
    ]
    this.dataMapping = {
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
      credit_score: (i) => parseInt(i),
      budget: (i) => parseInt(i),
      deposit: (i, o) => (parseInt(i) || 0) * (parseFloat(o.net_rent) || 0),
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
          `${o.street || ''} ${o.house_number || ''}, ${o.zip || ''} ${
            o.city || ''
          }`,
          ', '
        ).replace(/\s,/g, ',')
      },
    }
  }

  /**
   *
   */
  async validateHeader(sheet) {
    const header = get(sheet, `data.${this.headerCol}`) || []
    header.forEach((i) => {
      if (!this.columns.includes(i)) {
        throw new AppException('Invalid header data=' + i )
      }
    })
  }

  /**
   *
   */
  mapDataToEntity(row) {
    const [
      num, // 'No.',
      landlord_email, // if property manager helps adding properties on behalf of landlord,
      street, // 'Street',
      house_number, // 'House Number',
      address, // 'Extra Address',
      zip, // 'Postcode',
      city, // 'City',
      country, // 'Country',
      property_id, // 'Property ID',
      property_type, // 'Property Type',
      apt_type, // 'Apartment Type',
      house_type, // 'House Type',
      use_type, // 'Use Type',
      occupancy, // 'occupancy',
      ownership_type, // 'Ownership Type',
      marketing_type, // 'Sale Type',
      net_rent, // 'Net Rent',
      additional_costs, // 'Utility Costs',
      stp_garage, // 'Parking Rent',
      deposit, // 'Deposit',
      available_date, // 'Available from',
      from_date, // 'Visit from',
      currency, // 'Currency',
      construction_year, // 'Construction',
      last_modernization, // 'Last modernization',
      building_status, // 'Building Status',
      number_floors, // 'Number of floors',
      energy_efficiency, // 'Energy Consumption Value',
      firing, // 'Energy Carrier',
      heating_type, // 'Heating Type',
      area, // 'Living Space',
      rooms_number, // 'Number_of_Rooms',
      floor, // 'Floor',
      apartment_status, // 'Apartment Status', ----
      equipment_standard, // 'Amenities Type',
      furnished, // 'Furnished',
      parking_space_type, // 'Parking Space Type',
      room1_type, // 'Room 1',
      room1_tags, // 'Tags 1',
      room1_area,  // 'Area 1',
      room1_name,  // 'Name 1',
      room1_photos, // 'Photo 1',
      room2_type, // 'Room 2',
      room2_tags, // 'Tags 2',
      room2_area,  // 'Area 2',
      room2_name,  // 'Name 2',      
      room2_photos, // 'Photo 2',
      room3_type, // 'Room 3',
      room3_tags, // 'Tags 3',
      room3_area,  // 'Area 3',
      room3_name,  // 'Name 3',            
      room3_photos, // 'Photo 3',
      room4_type, // 'Room 4',
      room4_tags, // 'Tags 4',
      room4_area,  // 'Area 4',
      room4_name,  // 'Name 4',      
      room4_photos, // 'Photo 4',
      room5_type, // 'Room 5',
      room5_tags, // 'Tags 5',
      room5_area,  // 'Area 5',
      room5_name,  // 'Name 5',      
      room5_photos, // 'Photo 5',
      room6_type, // 'Room 6',
      room6_tags, // 'Tags 6',
      room6_area,  // 'Area 6',
      room6_name,  // 'Name 6',      
      room6_photos, // 'Photo 6',
      budget, // 'Salary Burden',
      rent_arrears, // 'Rent Arrears',
      credit_score, // 'Credit Score',
      tenant_min_age, // 'Tenant Age Min',
      tenant_max_age, // 'Tenant Age Max',
      family_status, // 'Family Status',
      non_smoker, // 'Smoking Allowed',
    ] = row

    const result = {
      landlord_email,
      street,
      house_number,
      zip,
      city,
      country: 'Germany',
      address,
      property_id,
      property_type,
      apt_type,
      house_type,
      use_type,
      occupancy,
      ownership_type,
      marketing_type,
      net_rent,
      additional_costs,
      stp_garage,
      deposit,
      available_date,
      from_date,
      currency,
      construction_year,
      last_modernization,
      building_status,
      number_floors,
      energy_efficiency,
      firing,
      heating_type,
      area,
      rooms_number,
      floor,
      apartment_status,
      equipment_standard,
      furnished,
      parking_space_type,
      room1_type,
      room1_tags,
      room1_area,
      room1_name,
      room1_photos,
      room2_type,
      room2_tags,
      room2_area,
      room2_name,
      room2_photos,
      room3_type,
      room3_tags,
      room3_area,
      room3_name,
      room3_photos,
      room4_type,
      room4_tags,
      room4_area,
      room4_name,
      room4_photos,
      room5_type,
      room5_tags,
      room5_area,
      room5_name,
      room5_photos,
      room6_type,
      room6_tags,
      room6_area,
      room6_name,
      room6_photos,
      budget,
      rent_arrears,
      credit_score,
      min_age: tenant_min_age,
      max_age: tenant_max_age,
      family_status,
      non_smoker,
    }

    const mapValue = (k, v, result) => {
      if (isFunction(this.dataMapping[k])) {
        return this.dataMapping[k](v, result)
      } else if (isString(v)) {
        if (has(this.dataMapping, k)) {
          return get(this.dataMapping, `${k}.${escapeStr(v)}`)
        }
        return escapeStr(v)
      }

      return v
    }

    return reduce(
      result,
      (n, v, k) => {

        if (v === undefined) {
          // Address should process separately
          if (k === 'address') {
            return { ...n, [k]: mapValue(k, '', result) }
          } else if (k == 'property_id') {
            const r = Math.random().toString(36).substr(2, 8).toUpperCase();
            return { ...n, [k]: r}
          }
          return n
        } else if (Object.keys(this.dataMapping).includes(k)) {
          return { ...n, [k]: mapValue(k, v, result) }
        } else if (k.match(/room\d+_type/)) {
          v = isString(v) ? escapeStr(v) : v
          return { ...n, [k]: get(this.dataMapping, `room_type.${v}`) }
        } 
        return { ...n, [k]: v }
      },
      {}
    )
  }

  /**
   *
   */
  async readFile(filePath) {
    const data = xlsx.parse(filePath, { cellDates: true })

    const sheet = data.find((i) => i.name === 'data')


    if (!sheet || !sheet.data) {
      throw new AppException('Invalid spreadsheet')
    }

    await this.validateHeader(sheet)

    const errors = []
    const toImport = []

    for (let k = this.headerCol + 1; k < sheet.data.length; k++) {
      if (k <= this.headerCol || isEmpty(sheet.data[k])) {
        continue
      }
      let itemData = this.mapDataToEntity(sheet.data[k])

      itemData = {
        ...itemData,
        credit_score:itemData.credit_score?parseFloat(itemData.credit_score)*100:0,
        floor:itemData.floor?itemData.floor:0,
      }

      let itemData = this.mapDataToEntity(sheet.data[k])

      itemData = {
        ...itemData,
        credit_score:itemData.credit_score?parseFloat(itemData.credit_score)*100:0,
        floor:itemData.floor?itemData.floor:0,
      }

      try {
        toImport.push({ line: k, data: await schema.validate(itemData) })
      } catch (e) {
        errors.push({ line: k, error: e.errors, street:itemData?.street, postcode: itemData?.zip })
      }
    }

    return { errors, data: toImport }
  }
}

module.exports = ExcelReader
