'use_strict'
const axios = require('axios')
const moment = require('moment')
const l = use('Localize')
const {
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
  FIRING_OEL,
  FIRING_GAS,
  FIRING_ELECTRIC,
  FIRING_SOLAR,
  FIRING_GROUND_HEAT,
  FIRING_REMOTE,
  FIRING_WATER_ELECTRIC,
  FIRING_PELLET,
  FIRING_COAL,
  FIRING_WOOD,
  FIRING_LIQUID_GAS,
  HEATING_TYPE_CENTRAL,
  HEATING_TYPE_FLOOR,
  HEATING_TYPE_OVEN,
  APARTMENT_TYPE_ATTIC,
  APARTMENT_TYPE_FLAT,
  APARTMENT_TYPE_MAISONETTE,
  APARTMENT_TYPE_PENTHOUSE,
  APARTMENT_TYPE_LOFT,
  APARTMENT_TYPE_TERRACES,
  APARTMENT_TYPE_SOUTERRAIN,
  APARTMENT_TYPE_GROUND,
  APARTMENT_TYPE_SOCIAL,
  APARTMENT_TYPE_ROOF,
  PARKING_SPACE_TYPE_GARAGE,
  PARKING_SPACE_TYPE_UNDERGROUND,
  PARKING_SPACE_TYPE_CARPORT,
  PARKING_SPACE_TYPE_OUTDOOR,
  PARKING_SPACE_TYPE_CAR_PARK,
  PARKING_SPACE_TYPE_DUPLEX,
  ESTATE_SYNC_TITLE_TEMPLATES,
  ESTATE_SYNC_VALID_FILE_TYPE_ATTACHMENTS,
  OPTIONS_TYPE_BUILD,
  OPTIONS_TYPE_APT,
  OPTIONS_TYPE_OUT,
  LANG_DE,
  PETS_NO,
  PROD_ENVIRONMENT
} = require('../constants')
const ESTATE_SYNC_AMENITY_LOCATIONS_FOR_DESCRIPTION = [
  OPTIONS_TYPE_BUILD,
  OPTIONS_TYPE_APT,
  OPTIONS_TYPE_OUT
]
const { invert, isFunction, isEmpty } = require('lodash')
const { calculateEnergyClassFromEfficiency } = use('App/Libs/utils')
const ContentType = use('App/Classes/ContentType')

const APARTMENT_TYPE_KEYS = {
  [APARTMENT_TYPE_FLAT]: 'landlord.property.details.building_apartment.type.flat',
  [APARTMENT_TYPE_GROUND]: 'landlord.property.details.building_apartment.type.ground',
  [APARTMENT_TYPE_ROOF]: 'landlord.property.details.building_apartment.type.roof',
  [APARTMENT_TYPE_MAISONETTE]: 'landlord.property.details.building_apartment.type.maisonette',
  [APARTMENT_TYPE_LOFT]: 'landlord.property.details.building_apartment.type.loft',
  [APARTMENT_TYPE_SOCIAL]: 'landlord.property.details.building_apartment.type.social',
  [APARTMENT_TYPE_SOUTERRAIN]: 'landlord.property.details.building_apartment.type.souterrain',
  [APARTMENT_TYPE_PENTHOUSE]: 'landlord.property.details.building_apartment.type.penthouse'
}

class EstateSync {
  baseUrl = `https://api.estatesync.com`

  static apartmentType = {
    // aparmentType must be one of apartment, attic, maisonette, penthouse, loft, terrace, lowerGroundFloor, groundFloor, upperGroundFloor, floor, other
    attic: APARTMENT_TYPE_ATTIC,
    maisonette: APARTMENT_TYPE_MAISONETTE,
    penthouse: APARTMENT_TYPE_PENTHOUSE,
    loft: APARTMENT_TYPE_LOFT,
    terrace: APARTMENT_TYPE_TERRACES,
    lowerGroundFloor: APARTMENT_TYPE_SOUTERRAIN,
    groundFloor: APARTMENT_TYPE_GROUND
  }

  static condition = {
    firstTimeUse: BUILDING_STATUS_FIRST_TIME_OCCUPIED,
    // 'needs renovation': BUILDING_STATUS_PART_COMPLETE_RENOVATION_NEED,
    mint: BUILDING_STATUS_NEW,
    // existing: BUILDING_STATUS_EXISTING,
    renovated: BUILDING_STATUS_PART_FULLY_RENOVATED,
    // 'partly refurbished': BUILDING_STATUS_PARTLY_REFURISHED,
    // 'in need of renovation': BUILDING_STATUS_IN_NEED_OF_RENOVATION,
    // 'ready to be built': BUILDING_STATUS_READY_TO_BE_BUILT,
    negotiable: BUILDING_STATUS_BY_AGREEMENT,
    modernised: BUILDING_STATUS_MODERNIZED,
    wellKept: BUILDING_STATUS_CLEANED,
    requiresRefurbishment: BUILDING_STATUS_ROUGH_BUILDING,
    // developed: BUILDING_STATUS_DEVELOPED,
    demolitionReady: BUILDING_STATUS_ABRISSOBJEKT,
    // projected: BUILDING_STATUS_PROJECTED,
    refurbished: BUILDING_STATUS_FULLY_REFURBISHED
  }

  static energyType = {
    // energySource must be one of oil, gas, electric, solar, geothermal, district, water, pellet, coal, wood, liquidGas
    oil: FIRING_OEL,
    gas: FIRING_GAS,
    electric: FIRING_ELECTRIC,
    solar: FIRING_SOLAR,
    geothermal: FIRING_GROUND_HEAT,
    district: FIRING_REMOTE,
    water: FIRING_WATER_ELECTRIC,
    pellet: FIRING_PELLET,
    coal: FIRING_COAL,
    wood: FIRING_WOOD,
    liquidGas: FIRING_LIQUID_GAS
  }

  static heatingType = {
    // heatingType must be one of stove, floor, central, district, underfloor, heatPump.
    central: HEATING_TYPE_CENTRAL,
    floor: HEATING_TYPE_FLOOR,
    stove: HEATING_TYPE_OVEN
  }

  makeNumeric = [
    'additionalCosts',
    'baseRent',
    'constructionYear',
    'heatingCosts',
    'livingArea',
    'numberOfBathRooms',
    'numberOfBedRooms',
    'numberOfFloors',
    'numberOfParkingSpaces',
    'numberOfRooms',
    'usableArea'
  ]

  makeBoolean = ['petsAllowed']

  mustHaveValue = ['constructionYear', 'lastRefurbished']

  static parkingSpaceType = {
    garage: PARKING_SPACE_TYPE_GARAGE,
    undergroundGarage: PARKING_SPACE_TYPE_UNDERGROUND,
    carport: PARKING_SPACE_TYPE_CARPORT,
    outdoor: PARKING_SPACE_TYPE_OUTDOOR,
    carPark: PARKING_SPACE_TYPE_CAR_PARK,
    duplex: PARKING_SPACE_TYPE_DUPLEX
  }

  map = {
    extra_costs: 'additionalCosts',
    additionalCostsIncludeHeatingCosts: this.composeAdditionalCosts,
    address: this.composeAddress,
    apartmentType: this.composeApartmentType,
    availableFrom: this.composeAvailableFrom,
    net_rent: 'baseRent',
    // commission: '5,95% incl. 19% VAT',
    // commissionDescription: 'My first commission description for a property.',
    condition: this.composeCondition,
    construction_year: "constructionYear",
    deposit: this.composeDeposit,
    // description: this.composeDescription,
    // energyCertificateStatus: 'present',
    floor: 'floor',
    // furnishingDescription: 'My first furnishing description for a property.',
    hasBalcony: this.composeBalcony,
    // hasBuiltInKitchen: true,
    hasCellar: this.composeCellar,
    // hasGarden: true,
    hasGuestToilet: this.composeGuestToilet,
    hasLift: this.composeLift,
    heating_costs: 'heatingCosts',
    heatingType: this.composeHeatingType,
    interiorQuality: this.composeInteriorQuality,
    // isAccessible: true,
    // isSuitableAsSharedFlat: false,
    lastRefurbished: this.composeLastRefurbish,
    livingArea: this.composeLivingArea,
    // locationDescription: 'My first location description for a property.',
    // miscellaneousDescription: 'My first misc description for a property.',
    // bathrooms_number: 'numberOfBathrooms',
    // bedrooms_number: 'numberOfBedrooms',
    number_floors: 'numberOfFloors',
    parking_space: 'numberOfParkingSpaces',
    rooms_number: 'numberOfRooms',
    // parkingSpaceRent: 45,
    parkingSpaceType: this.composeParkingSpaceType,
    petsAllowed: this.composePetsAllowed,
    // requiresWBS: false,
    // residentialEnergyCertificate: this.composeEnergyClass,
    title: this.composeTitle,
    totalRent: this.composeTotalRent,
    usableArea: this.composeLivingArea
  }

  constructor(apiKey = '') {
    this.apiKey = apiKey
    axios.defaults.headers.common.Authorization = `Bearer ${apiKey}`
  }

  composeLivingArea({ area }) {
    return +area
  }

  /**
   * @param { { net_rent: string; extra_cost: string } } estateData 
   * @returns { number }
   */
  composeTotalRent({ net_rent, extra_costs }) {
    return +net_rent + +extra_costs
  }

  /**
   * @param { { construction_year: date } } estateData 
   * @returns { string }
   */
  composeConstructionYear({ construction_year }) {
    return new Date(construction_year).getFullYear()
  }

  /**
   * @param { { pets_allowed: number } } estateData 
   * @returns { boolean }
   */
  composePetsAllowed({ pets_allowed }) {
    return pets_allowed !== PETS_NO
  }

  composeDescription({ amenities }) {
    if (!amenities?.length) {
      return ''
    }
    const validAmenities = amenities.reduce((validAmenities, amenity) => {
      if (ESTATE_SYNC_AMENITY_LOCATIONS_FOR_DESCRIPTION.includes(amenity.location)) {
        if (l.get(`${amenity?.option?.title}`, LANG_DE) !== amenity?.option?.title) {
          return [...validAmenities, l.get(`${amenity?.option?.title}`, LANG_DE)]
        }
        return [...validAmenities, l.get(`${amenity?.option?.title}.message`, LANG_DE)]
      }
      return validAmenities
    }, [])
    return validAmenities.join(', ')
  }

  composeApartmentType({ apt_type }) {
    if (apt_type) {
      const apartmentType = invert(EstateSync.apartmentType)
      if (apartmentType[apt_type]) {
        return apartmentType[apt_type]
      }
      return 'other'
    }
  }

  composeAdditionalCosts({ extra_costs }) {
    if (Number(extra_costs)) {
      return true
    }
  }

  /**
   * @param { { vacant_date: date } } estateData 
   * @returns { string }
   */
  composeAvailableFrom({ vacant_date }) {
    if (vacant_date) {
      return vacant_date.toLocaleDateString("de-DE")
    }
    return l.get(`prospect.property.details.txt_rent_start_from_now`, LANG_DE)
  }

  /**
   * 
   * @param { string } amen 
   * @returns 
   */
  hasAmenity(amenities, amen) {
    return !!amenities.find(
      (am) => am.option.title === amen
    )
  }

  /**
   * 
   * @param {*} estate 
   * @returns boolean
   */
  composeGuestToilet({ amenities }) {
    return this.hasAmenity(amenities, "apartment.amenities.WC_bathroom.guest_toilet")
  }

  composeInteriorQuality({ amenities }) {
    return this.hasAmenity(amenities, "apt_exclusive_high_quality_luxury") ? "high" : undefined
  }

  composeBalcony({ amenities }) {
    return this.hasAmenity(amenities, "apt_balcony")
  }

  composeCellar({ amenities }) {
    return this.hasAmenity(amenities, "cellar")
  }

  composeLift({ amenities }) {
    return this.hasAmenity(amenities, "elevator")
  }

  composeHeatingType({ heating_type }) {
    const heatingType = invert(EstateSync.heatingType)
    if (heating_type.length > 0 && heatingType[heating_type[0]]) {
      return heatingType[heating_type]
    }
  }

  composeCondition({ building_status }) {
    const condition = invert(EstateSync.condition)
    return condition[building_status]
  }

  composeDeposit({ deposit, net_rent }) {
    if (!deposit || !net_rent) {
      return ''
    }
    let num = deposit / net_rent
    if (num - Math.floor(num) !== 0) {
      // this number has decimal place
      num = Math.round(num * 10) / 10
    }
    return `${num}` + l.get(`landlord.property.lease_price.deposit_in_monthly_rents`, LANG_DE)
  }

  composeLastRefurbish({ last_modernization }) {
    return last_modernization ? +moment(last_modernization).format('Y') || 0 : 0
  }

  composeAttachments({ cover, rooms = [], files = [] }) {
    let attachments = []
    if (cover) {
      attachments = EstateSync.addAttachment(cover, attachments)
    }
    // images:
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].images.length > 0) {
        for (let k = 0; k < rooms[i].images.length; k++) {
          attachments = EstateSync.addAttachment(rooms[i].images[k].url, attachments)
        }
      }
    }
    // files:
    for (let i = 0; i < files.length; i++) {
      if (ESTATE_SYNC_VALID_FILE_TYPE_ATTACHMENTS.indexOf(files[i].type) > -1) {
        attachments = EstateSync.addAttachment(files[i].url, attachments)
      }
    }
    return attachments
  }

  static addAttachment(url, attachments) {
    const extension = url.split('.').pop()
    const fileType = ContentType.getContentType(extension)
    if (fileType.match(/^image/)) {
      // EstateSync only accepts image/jpeg and application/pdf
      attachments = [...attachments, { url, type: 'image/jpeg' }]
    } else if (fileType === 'application/pdf') {
      attachments = [...attachments, { url, type: fileType }]
    }
    return attachments
  }

  composeAddress(estate) {
    const address = {
      city: estate?.city,
      postalCode: estate?.zip,
      publish: estate?.full_address,
      street: estate?.street,
      streetNumber: estate?.house_number
    }
    return address
  }

  composeTitle({ rooms_number, area, apt_type, city, country, category }, is_building = false) {
    if (is_building) {
      return category?.name
    }
    let estateSyncTitleTemplate = ESTATE_SYNC_TITLE_TEMPLATES.others
    const formatter = new Intl.NumberFormat('de-DE')
    if (ESTATE_SYNC_TITLE_TEMPLATES[country.toLowerCase().trim()]) {
      estateSyncTitleTemplate = ESTATE_SYNC_TITLE_TEMPLATES[country.toLowerCase().trim()]
    }
    const apartmentType = l.get(
      `${APARTMENT_TYPE_KEYS[apt_type]}.message`,
      estateSyncTitleTemplate.lang
    )
    const mapObj = {
      rooms_number:
        rooms_number % 1 === 0 ? parseInt(rooms_number) : formatter.format(rooms_number),
      area: area % 1 === 0 ? parseInt(area) : formatter.format(area),
      apartmentType,
      city
    }

    const re = new RegExp(Object.keys(mapObj).join('|'), 'gi')
    const title = estateSyncTitleTemplate.key.replace(re, function (matched) {
      return mapObj[matched]
    })
    return title
  }

  composeEnergyClass(estate) {
    const energyClass = {}
    if (estate?.energy_efficiency) {
      energyClass.energyClass = calculateEnergyClassFromEfficiency(estate?.energy_efficiency)
      const energyType = invert(EstateSync.energyType)
      if (estate?.firing?.length > 0 && energyType[estate.firing[0]]) {
        energyClass.energySource = energyType[estate.firing[0]]
      }
    }
    if (!isEmpty(energyClass)) {
      energyClass.type = 'consumption'
      // we don't have it so lets set to minimum because this is required.
      energyClass.energyConsumption = 0.01
      return energyClass
    }
  }

  composeEstate(estate) {
    let newEstate
    for (const [key, value] of Object.entries(this.map)) {
      if (isFunction(value)) {
        newEstate = { ...newEstate, [key]: value.bind(this)(estate) }
      } else if (this.makeNumeric.indexOf(value) > -1) {
        newEstate = { ...newEstate, [value]: Number(estate[key]) }
      } else if (this.makeBoolean.indexOf(value) > -1) {
        newEstate = { ...newEstate, [value]: estate[key] === true }
      } else {
        newEstate = { ...newEstate, [value]: estate[key] }
      }
    }
    /* As per Andrey we're not going to send Energy Certificate
    const energyClass = this.composeEnergyClass(estate)
    if (!isEmpty(energyClass) && energyClass?.energyClass && energyClass?.energySource) {
      newEstate.residentialEnergyCertificate = energyClass
    } */
    const description = this.composeDescription(estate)
    if (description) {
      newEstate.description = description
    }

    for (let i = 0; i < this.mustHaveValue.length; i++) {
      if (!newEstate[this.mustHaveValue[i]]) {
        delete newEstate[this.mustHaveValue[i]]
      }
    }
    return newEstate
  }

  composeParkingSpaceType({ parking_space_type }) {
    const parkingSpaceType = invert(EstateSync.parkingSpaceType)
    if (parkingSpaceType?.[parking_space_type?.[0]]) {
      return parkingSpaceType[parking_space_type[0]]
    }
  }

  async generateEstateData({ type = 'apartmentRent', estate, contactId = '' }, is_building = false) {
    const fields = this.composeEstate(estate)
    if (is_building) {
      fields.title = this.composeTitle(estate, true)
    }
    const attachments = this.composeAttachments(estate)

    let externalId = `${process.env.NODE_ENV}-${estate.id}`
    if (process.env.NODE_ENV === PROD_ENVIRONMENT) {
      externalId = `Breeze-${estate.id}`
    }

    const body = {
      type,
      fields,
      attachments,
      externalId
    }
    if (contactId) {
      body.contactId = contactId
    }

    return body
  }

  async postEstate({ type = 'apartmentRent', estate, contactId = '' }, is_building = false) {
    try {
      const body = this.generateEstateData({ type, estate, contactId }, is_building)

      const ret = await axios.post(`${this.baseUrl}/properties`, body, { timeout: 5000 })
      return {
        success: true,
        data: ret.data
      }
    } catch (err) {
      console.log(err)
      await require('../Service/MailService').sendEmailToOhneMakler(
        `EstateSync.postEstate: ERROR ` + JSON.stringify(err),
        'barudo@gmail.com'
      )
      if (err?.response?.data) {
        return {
          success: false,
          data: err.response.data
        }
      }
      return {
        success: false
      }
    }
  }

  async updateEstate({
    type = 'apartmentRent',
    estate,
    contactId = '',
    propertyId,
    titleOverride,
    descriptionOverride
  }) {
    try {
      const fields = this.composeEstate(estate)
      const attachments = this.composeAttachments(estate)
      fields.title = titleOverride ?? fields.title
      fields.description = descriptionOverride ?? fields.description
      const body = {
        type,
        fields,
        attachments
      }
      if (contactId) {
        body.contactId = contactId
      }
      const ret = await axios.put(`${this.baseUrl}/properties/${propertyId}`, body, {
        timeout: 5000
      })
      return {
        success: true,
        data: ret.data
      }
    } catch (err) {
      console.log(err)
      if (err?.response?.data) {
        return {
          success: false,
          data: err.response.data
        }
      }
      return {
        success: false
      }
    }
  }

  async publishEstate({ propertyId, targetId }) {
    try {
      const ret = await axios.post(
        `${this.baseUrl}/listings`,
        { propertyId, targetId },
        { timeout: 5000 }
      )
      return {
        success: true,
        data: ret.data
      }
    } catch (err) {
      console.log(err)
      if (err?.response?.data) {
        return {
          success: false,
          data: err.response.data
        }
      } else {
        return {
          success: false
        }
      }
    }
  }

  async post(type, data) {
    const possibleTypes = [
      'account',
      'properties',
      'targets',
      'listings',
      'contacts',
      'requests',
      'webhooks'
    ]
    if (possibleTypes.indexOf(type) < 0) {
      return false
    }
    try {
      const ret = await axios.post(`${this.baseUrl}/${type}`, data, { timeout: 5000 })
      return {
        success: true,
        data: ret.data
      }
    } catch (err) {
      if (err?.response?.data) {
        return {
          success: false,
          data: err.response.data
        }
      } else {
        return {
          success: false
        }
      }
    }
  }

  async put(type, data, id = '') {
    const possibleTypes = [
      'account/credentials/immobilienscout-24',
      'account/credentials/immobilienscout-24-sandbox',
      'properties',
      'listings',
      'contacts'
    ]
    if (possibleTypes.indexOf(type) < 0) {
      return false
    }
    try {
      const ret = await axios.put(`${this.baseUrl}/${type}${id ? '/' + id : ''}`, data)
      return {
        success: true,
        data: ret.data
      }
    } catch (err) {
      if (err?.response?.data) {
        return {
          success: false,
          data: err.response.data
        }
      } else {
        return {
          success: false
        }
      }
    }
  }

  async get(type = 'properties', id = '') {
    const possibleTypes = [
      'account',
      'properties',
      'targets',
      'listings',
      'contacts',
      'requests',
      'webhooks'
    ]
    if (possibleTypes.indexOf(type) < 0) {
      return false
    }
    try {
      const ret = await axios.get(`${this.baseUrl}/${type}${id ? '/' + id : ''}`)
      return {
        success: true,
        data: ret?.data
      }
    } catch (err) {
      console.log(err)
      if (err?.response?.data) {
        return {
          success: false,
          data: err.response.data
        }
      } else {
        return {
          success: false
        }
      }
    }
  }

  async delete(id, type = 'properties') {
    const possibleTypes = ['properties', 'targets', 'listings', 'contacts', 'requests', 'webhooks']
    if (possibleTypes.indexOf(type) < 0) {
      return false
    }
    if (!id) {
      return false
    }

    try {
      const ret = await axios.delete(`${this.baseUrl}/${type}${id ? '/' + id : ''}`)
      if (ret?.status === 200) {
        return {
          success: true
        }
      }
      return {
        success: false
      }
    } catch (err) {
      console.log(err)
      if (err?.response?.data) {
        return {
          success: false,
          message: err.response.data
        }
      } else {
        return {
          success: false
        }
      }
    }
  }
}

module.exports = EstateSync
