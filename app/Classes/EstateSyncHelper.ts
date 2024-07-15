import { APARTMENT_TYPE, BUILDING_STATUS, FILE_TYPE, FIRING_TYPE, HEATING_TYPE, OPTIONS_TYPE, PARKING_SPACE_TYPE, PETS, SUPPORTED_LANGUAGES } from "@App/constants"
import { EstateWithDetails } from "./EstateTypes"
import { ContentType } from "./ContentType"

const l = use('Localize')

/**
 * constants use later
 */
const ESTATE_SYNC_TITLE_TEMPLATES = {
  germany: {
    key: 'rooms_number Zimmer area m² apartmentType in city',
    lang: 'de'
  },
  deutschland: {
    key: 'rooms_number Zimmer area m² apartmentType in city',
    lang: 'de'
  },
  others: {
    key: 'rooms_number Rooms area m² apartmentType in city',
    lang: 'en'
  }
}

const APARTMENT_TYPE_KEYS: { [key: number]: string } = {
  [APARTMENT_TYPE.FLAT]: 'landlord.property.details.building_apartment.type.flat',
  [APARTMENT_TYPE.GROUND]: 'landlord.property.details.building_apartment.type.ground',
  [APARTMENT_TYPE.ROOF]: 'landlord.property.details.building_apartment.type.roof',
  [APARTMENT_TYPE.MAISONETTE]: 'landlord.property.details.building_apartment.type.maisonette',
  [APARTMENT_TYPE.LOFT]: 'landlord.property.details.building_apartment.type.loft',
  [APARTMENT_TYPE.SOCIAL]: 'landlord.property.details.building_apartment.type.social',
  [APARTMENT_TYPE.SOUTERRAIN]: 'landlord.property.details.building_apartment.type.souterrain',
  [APARTMENT_TYPE.PENTHOUSE]: 'landlord.property.details.building_apartment.type.penthouse'
}

type EstateSyncAppartmentType = "apartment" | "attic" | "maisonette" | "penthouse" | "loft" | "terrace" | "lowerGroundFloor" | "groundFloor" | "upperGroundFloor" | "floor" | "other"
type EstateSyncConditionType = "firstTimeUse" | "mint" | "requiresRefurbishment" | "refurbished" | "renovated" | "modernised" | "wellKept" | "demolitionReady" | "negotiable"
type EstateSyncEnergyType = "oil" | "gas" | "electric" | "solar" | "geothermal" | "district" | "water" | "pellet" | "coal" | "wood" | "liquidGas"
type EstateSyncHeatingType = "stove" | "floor" | "central" | "district" | "underfloor" | "heatPump"
type EstateSyncInteriorQuality = "standard" | "high" | "luxury"
type EstateSyncParkingSpaceType = "garage" | "undergroundGarage" | "carport" | "outdoor" | "carPark" | "duplex"

export type EstateSyncProperty = {
  additionalCosts: number
  additionalCostsIncludeHeatingCosts: boolean
  address: {
    city: string
    postalCode: string
    publish: string
    street: string
    streetNumber: string
  }
  apartmentType: EstateSyncAppartmentType
  availableFrom: string
  baseRent: number
  condition: EstateSyncConditionType
  constructionYear: number
  deposit: string
  description: string
  floor: number
  furnishingDescription?: string
  hasBalcony: boolean
  hasCellar: boolean
  // hasGarden: true
  hasGuestToilet: boolean
  hasLift: boolean
  heatingCosts: number
  heatingType?: EstateSyncHeatingType
  interiorQuality: EstateSyncInteriorQuality
  // isAccessible: true
  // isSuitableAsSharedFlat: false
  lastRefurbished: number
  livingArea: number
  locationDescription?: string
  miscellaneousDescription?: string
  // numberOfBathrooms: bathrooms_number
  // numberOfBedrooms: bedrooms_number
  numberOfFloors: number
  numberOfParkingSpaces: number
  numberOfRooms: number
  // parkingSpaceRent: 45
  parkingSpaceType: EstateSyncParkingSpaceType
  petsAllowed: boolean
  // requiresWBS: false
  residentialEnergyCertificate?: {
    type: "consumption" | "need"
    prior2014?: boolean
    energySource: EstateSyncEnergyType
    energyNeed?: number
    energyConsumption?: number
    energyClass?: string
    warmWaterIncluded?: boolean
  }
  title?: string
  totalRent: number
  usableArea: number
}

const apartmentTypeMap: { [key: number]: EstateSyncAppartmentType } = {
  // aparmentType must be one of apartment, attic, maisonette, penthouse, loft, terrace, lowerGroundFloor, groundFloor, upperGroundFloor, floor, other
  [APARTMENT_TYPE.ATTIC]: "attic",
  [APARTMENT_TYPE.MAISONETTE]: "maisonette",
  [APARTMENT_TYPE.PENTHOUSE]: "penthouse",
  [APARTMENT_TYPE.LOFT]: "loft",
  [APARTMENT_TYPE.TERRACES]: "terrace",
  [APARTMENT_TYPE.SOUTERRAIN]: "lowerGroundFloor",
  [APARTMENT_TYPE.GROUND]: "groundFloor",
}

const buildingConditionMap: { [key: number]: EstateSyncConditionType } = {
  [BUILDING_STATUS.FIRST_TIME_OCCUPIED]: "firstTimeUse",
  // 'needs renovation': BUILDING_STATUS_PART_COMPLETE_RENOVATION_NEED,
  [BUILDING_STATUS.NEW]: "mint",
  // [BUILDING_STATUS.EXISTING]: "existing",
  [BUILDING_STATUS.PART_FULLY_RENOVATED]: "renovated",
  // [BUILDING_STATUS.PARTLY_REFURISHED]: 'partly refurbished',
  // [BUILDING_STATUS.IN_NEED_OF_RENOVATION]: 'in need of renovation',
  // [BUILDING_STATUS.READY_TO_BE_BUILT]: 'ready to be built',
  [BUILDING_STATUS.BY_AGREEMENT]: "negotiable",
  [BUILDING_STATUS.MODERNIZED]: "modernised",
  [BUILDING_STATUS.CLEANED]: "wellKept",
  [BUILDING_STATUS.ROUGH_BUILDING]: "requiresRefurbishment",
  // [BUILDING_STATUS.DEVELOPED]: "developed",
  [BUILDING_STATUS.ABRISSOBJEKT]: "demolitionReady",
  // [BUILDING_STATUS.PROJECTED]: "projected",
  [BUILDING_STATUS.FULLY_REFURBISHED]: "refurbished",
}

const energyTypeMap: { [key: number]: EstateSyncEnergyType } = {
  // energySource must be one of oil, gas, electric, solar, geothermal, district, water, pellet, coal, wood, liquidGas
  [FIRING_TYPE.OEL]: "oil",
  [FIRING_TYPE.GAS]: "gas",
  [FIRING_TYPE.ELECTRIC]: "electric",
  [FIRING_TYPE.SOLAR]: "solar",
  [FIRING_TYPE.GROUND_HEAT]: "geothermal",
  [FIRING_TYPE.REMOTE]: "district",
  [FIRING_TYPE.WATER_ELECTRIC]: "water",
  [FIRING_TYPE.PELLET]: "pellet",
  [FIRING_TYPE.COAL]: "coal",
  [FIRING_TYPE.WOOD]: "wood",
  [FIRING_TYPE.LIQUID_GAS]: "liquidGas",
}

const heatingTypeMap: { [key: number]: EstateSyncHeatingType } = {
  [HEATING_TYPE.CENTRAL]: "central",
  [HEATING_TYPE.FLOOR]: "floor",
  [HEATING_TYPE.OVEN]: "stove",
}

const parkingSpaceTypeMap: { [key: number]: EstateSyncParkingSpaceType } = {
  [PARKING_SPACE_TYPE.GARAGE]: "garage",
  [PARKING_SPACE_TYPE.UNDERGROUND]: "undergroundGarage",
  [PARKING_SPACE_TYPE.CARPORT]: "carport",
  [PARKING_SPACE_TYPE.OUTDOOR]: "outdoor",
  [PARKING_SPACE_TYPE.CAR_PARK]: "carPark",
  [PARKING_SPACE_TYPE.DUPLEX]: "duplex",
}


function hasAmenity(amenities: EstateWithDetails["amenities"], amen: string): boolean {
  return !!amenities.find(
    (am) => am.option?.title === amen
  )
}

const extract = {
  additionalCostsIncludeHeating({ extra_costs: extraCosts }: EstateWithDetails): boolean {
    return Number(extraCosts) !== 0
  },
  address({ city, zip, full_address: fullAddress, street, house_number: houseNumber }: EstateWithDetails): EstateSyncProperty["address"] {
    return {
      city: city,
      postalCode: zip,
      publish: fullAddress,
      street: street,
      streetNumber: houseNumber
    }
  },
  appartment({ apt_type: aptType }: EstateWithDetails): EstateSyncAppartmentType {
    if (aptType) {
      const apartmentType = apartmentTypeMap
      if (apartmentType[aptType]) {
        return apartmentType[aptType]
      }
    }

    return 'other'
  },
  availableFrom({ vacant_date: vacantDate }: EstateWithDetails): string {
    if (vacantDate) {
      return vacantDate.toLocaleDateString("de-DE")
    }
    return l.get(`prospect.property.details.txt_rent_start_from_now`, SUPPORTED_LANGUAGES.DE)
  },
  condition({ building_status: buildingStatus }: EstateWithDetails): EstateSyncConditionType {
    return buildingConditionMap[buildingStatus]
  },
  deposit({ deposit, net_rent: netRent }: EstateWithDetails): string {
    if (!deposit || !netRent) {
      return ''
    }
    let num = deposit / netRent
    if (num - Math.floor(num) !== 0) {
      // this number has decimal place
      num = Math.round(num * 10) / 10
    }
    return `${num} ${l.get('landlord.property.lease_price.deposit_in_monthly_rents', SUPPORTED_LANGUAGES.DE)}`
  },
  description({ amenities }: EstateWithDetails): string {
    if (!amenities?.length) {
      return ''
    }
    const validAmenities = amenities.reduce((validAmenities, amenity) => {
      if ([OPTIONS_TYPE.BUILD, OPTIONS_TYPE.APT, OPTIONS_TYPE.OUT].includes(amenity.location)) {
        if (amenity.type === 'custom_amenity') {
          return [...validAmenities, amenity.amenity]
        }
        if (l.get(`${amenity?.option?.title}`, SUPPORTED_LANGUAGES.DE) !== amenity?.option?.title) {
          return [...validAmenities, l.get(`${amenity?.option?.title}`, SUPPORTED_LANGUAGES.DE)]
        }
        return [...validAmenities, l.get(`${amenity?.option?.title}.message`, SUPPORTED_LANGUAGES.DE)]
      }
      return validAmenities
    }, [])
    return validAmenities.join(', ')
  },
  hasBalcony({ amenities }: EstateWithDetails): boolean {
    return hasAmenity(amenities, "apt_balcony")
  },
  hasCellar({ amenities }: EstateWithDetails): boolean {
    return hasAmenity(amenities, "cellar")
  },
  hasGuestToilet({ amenities }: EstateWithDetails): boolean {
    return hasAmenity(amenities, "apartment.amenities.WC_bathroom.guest_toilet")
  },
  hasLift({ amenities }: EstateWithDetails): boolean {
    return hasAmenity(amenities, "elevator")
  },
  heatingType({ heating_type: heatingType }: EstateWithDetails): EstateSyncHeatingType | undefined {
    if (heatingType.length > 0 && heatingTypeMap[heatingType[0]]) {
      return heatingTypeMap[heatingType[0]]
    }
  },
  interiorQuality({ amenities }: EstateWithDetails): EstateSyncInteriorQuality {
    return hasAmenity(amenities, "apt_exclusive_high_quality_luxury") ? "high" : "standard"
  },
  lastRefurbished({ last_modernization: lastModernization }: EstateWithDetails): number {
    return lastModernization?.getFullYear()
  },
  livingArea({ area }: EstateWithDetails): number {
    return +area;
  },
  parkingSpaceType({ parking_space_type: parkingSpaceType }: EstateWithDetails): EstateSyncParkingSpaceType {
    return parkingSpaceTypeMap?.[parkingSpaceType?.[0]]
  },
  petsAllowed({ pets_allowed: petsAllowed }: EstateWithDetails): boolean {
    return petsAllowed !== PETS.NO
  },
  title({ rooms_number: roomsNumber, area, apt_type: aptType, city, country, category }: EstateWithDetails, isBuilding: boolean): string | undefined {
    if (isBuilding) {
      return category?.name
    }
    let estateSyncTitleTemplate = ESTATE_SYNC_TITLE_TEMPLATES.others
    const formatter = new Intl.NumberFormat('de-DE')
    if (ESTATE_SYNC_TITLE_TEMPLATES[country.toLowerCase().trim()]) {
      estateSyncTitleTemplate = ESTATE_SYNC_TITLE_TEMPLATES[country.toLowerCase().trim()]
    }
    const apartmentType = l.get(
      `${APARTMENT_TYPE_KEYS[aptType]}.message`,
      estateSyncTitleTemplate.lang
    )
    const mapObj = {
      rooms_number:
        parseFloat(roomsNumber) % 1 === 0 ? parseInt(roomsNumber) : formatter.format(parseFloat(roomsNumber)),
      area: parseFloat(area) % 1 === 0 ? parseInt(area) : formatter.format(parseFloat(area)),
      apartmentType,
      city
    }

    const re = new RegExp(Object.keys(mapObj).join('|'), 'gi')
    const title = estateSyncTitleTemplate.key.replace(re, function (matched) {
      return mapObj[matched]
    })
    return title
  },
  totalRent({ net_rent: netRent, extra_costs: extraCosts }: EstateWithDetails): number {
    return +netRent + +extraCosts
  },
  // @todo currently not in use
  composeEnergyClass({ energy_efficiency: energyEfficiency, firing }: EstateWithDetails) {

    const ENERGY_CLASS_USING_EFFICIENCY = [
      { level: 'A+', value: 30 },
      { level: 'A', value: 50 },
      { level: 'B', value: 75 },
      { level: 'C', value: 100 },
      { level: 'D', value: 130 },
      { level: 'E', value: 160 },
      { level: 'F', value: 200 },
      { level: 'G', value: 250 },
      { level: 'H', value: 250 }
    ]

    const calculateEnergyClassFromEfficiency = (efficiency: number): string => {
      let idx: number
      if (efficiency >= ENERGY_CLASS_USING_EFFICIENCY.slice(-1)[0].value) {
        idx = ENERGY_CLASS_USING_EFFICIENCY.length - 1
      } else {
        idx = ENERGY_CLASS_USING_EFFICIENCY.slice(0, -1).findIndex((level) => efficiency < level.value)
      }
      return ENERGY_CLASS_USING_EFFICIENCY[idx].level
    }

    const energyCert: Partial<EstateSyncProperty["residentialEnergyCertificate"]> = {}
    if (energyEfficiency !== undefined) {
      energyCert.energyClass = calculateEnergyClassFromEfficiency(Number(energyEfficiency))
    }
    if (firing?.length > 0 && energyTypeMap[firing[0]] !== undefined) {
      energyCert.energySource = energyTypeMap[firing[0]]
    }
    if (Object.keys(energyCert).length >= 0) {
      energyCert.type = 'consumption'
      // we don't have it so lets set to minimum because this is required.
      energyCert.energyConsumption = 0.01
      return energyCert
    }
  }
}

export type EstateSyncAttachment = {
  url: string,
  title: string,
  type: string,
}

const attachment = {
  create(url: string, name: string): EstateSyncAttachment | undefined {
    const fileType = ContentType.getContentType(url)

    let title = '';
    if (name?.length > 0) {
      const [titleKey, ...titleRest] = name?.split(' ')
      title = name && [l.get(`${titleKey}.message`, SUPPORTED_LANGUAGES.DE), ...titleRest].join(" ")
    }

    // EstateSync only accepts image/jpeg and application/pdf
    if (fileType.match(/^image/)) {
      return { url, title, type: ContentType.mimeTypes.jpeg }
    } else if (fileType === ContentType.mimeTypes.pdf) {
      return { url, title, type: fileType }
    }
  },
  composeAll({ cover, rooms = [], files = [] }: EstateWithDetails): EstateSyncAttachment[] {
    let attachments: { title: string, url: string, type: string }[] = []

    // sort the rooms by id -> this is how it is shown on out webapp, keep the order
    rooms.sort((room1, room2) => room1.id - room2.id)

    // add a cover, but only when it is not the first image of the rooms anyway
    if (cover && rooms[0]?.[0]?.url !== cover) {
      const coverAtt = attachment.create(cover, "")
      coverAtt && attachments.push(coverAtt)
    }

    // images:
    let att
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].images.length > 0) {
        for (let k = 0; k < rooms[i].images.length; k++) {
          att = attachment.create(rooms[i].images[k].url, rooms[i].name)
          att && attachments.push(att)
        }
      }
    }
    // files:
    for (let i = 0; i < files.length; i++) {
      if ([FILE_TYPE.EXTERNAL, FILE_TYPE.PLAN, FILE_TYPE.CUSTOM].includes(files[i].type)) {
        att = attachment.create(files[i].url, "")
        att && attachments.push(att)
      }
    }

    // // @todo remove again for envs
    // for (var i = 0; i < attachments.length; ++i) {
    //   attachments[i].url = attachments[i].url.replace("breeze-files-dev", "breeze-files")
    // }

    return attachments
  }
}


export class EstateSyncHelper {

  static convertDataToEstateSyncFormat(estate: EstateWithDetails, isBuilding = false): EstateSyncProperty {
    return {
      additionalCosts: +estate.extra_costs,
      additionalCostsIncludeHeatingCosts: extract.additionalCostsIncludeHeating(estate),
      address: extract.address(estate),
      apartmentType: extract.appartment(estate),
      availableFrom: extract.availableFrom(estate),
      baseRent: +estate.net_rent,
      condition: extract.condition(estate),
      constructionYear: parseInt(estate.construction_year),
      deposit: extract.deposit(estate),
      description: extract.description(estate),
      floor: estate.floor,
      hasBalcony: extract.hasBalcony(estate),
      // hasBuiltInKitchen: true,
      hasCellar: extract.hasCellar(estate),
      hasGuestToilet: extract.hasGuestToilet(estate),
      hasLift: extract.hasLift(estate),
      heatingCosts: Number(estate.heating_costs),
      heatingType: extract.heatingType(estate),
      interiorQuality: extract.interiorQuality(estate),
      lastRefurbished: extract.lastRefurbished(estate),
      livingArea: extract.livingArea(estate),
      numberOfFloors: estate.number_floors,
      numberOfParkingSpaces: Number(estate.parking_space),
      numberOfRooms: parseInt(estate.rooms_number),
      parkingSpaceType: extract.parkingSpaceType(estate),
      petsAllowed: extract.petsAllowed(estate),
      // residentialEnergyCertificate: extract.composeEnergyClass(estate),
      title: extract.title(estate, isBuilding),
      totalRent: extract.totalRent(estate),
      usableArea: extract.livingArea(estate),
    }
  }

  static composeAttachments(estate: EstateWithDetails): EstateSyncAttachment[] {
    return attachment.composeAll(estate)
  }
}
