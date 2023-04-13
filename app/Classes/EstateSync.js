'use_strict'
const axios = require('axios')
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
  HEATING_TYPE_NO,
  HEATING_TYPE_CENTRAL,
  HEATING_TYPE_FLOOR,
  HEATING_TYPE_REMOTE,
  HEATING_TYPE_OVEN,
} = require('../constants')
const { invert, isFunction } = require('lodash')

class EstateSync {
  heatingType = {
    //heatingType must be one of stove, floor, central, district, underfloor, heatPump.
    central: HEATING_TYPE_CENTRAL,
    floor: HEATING_TYPE_FLOOR,
    stove: HEATING_TYPE_OVEN,
  }
  condition = {
    'first time occupied': BUILDING_STATUS_FIRST_TIME_OCCUPIED,
    'needs renovation': BUILDING_STATUS_PART_COMPLETE_RENOVATION_NEED,
    new: BUILDING_STATUS_NEW,
    existing: BUILDING_STATUS_EXISTING,
    'fully renovated': BUILDING_STATUS_PART_FULLY_RENOVATED,
    'partly refurbished': BUILDING_STATUS_PARTLY_REFURISHED,
    'in need of renovation': BUILDING_STATUS_IN_NEED_OF_RENOVATION,
    'ready to be built': BUILDING_STATUS_READY_TO_BE_BUILT,
    'by agreement': BUILDING_STATUS_BY_AGREEMENT,
    modernized: BUILDING_STATUS_MODERNIZED,
    cleaned: BUILDING_STATUS_CLEANED,
    'rough building': BUILDING_STATUS_ROUGH_BUILDING,
    developed: BUILDING_STATUS_DEVELOPED,
    abrissobjekt: BUILDING_STATUS_ABRISSOBJEKT,
    projected: BUILDING_STATUS_PROJECTED,
    refurbished: BUILDING_STATUS_FULLY_REFURBISHED,
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
    'usableArea',
  ]

  makeBoolean = ['petsAllowed']

  mustHaveValue = ['constructionYear']

  map = {
    extra_costs: 'additionalCosts',
    //additionalCostsIncludeHeatingCosts: true,
    address: this.composeAddress,
    //apartmentType: 'penthouse',
    //availableFrom: 'immediately, latest in March',
    net_rent: 'baseRent',
    //commission: '5,95% incl. 19% VAT',
    //commissionDescription: 'My first commission description for a property.',
    construction_year: 'constructionYear',
    deposit: this.composeDeposit,
    //description: 'My first detailed description for a property.',
    //energyCertificateStatus: 'present',
    floor: 'floor',
    //furnishingDescription: 'My first furnishing description for a property.',
    //hasBalcony: true,
    //hasBuiltInKitchen: true,
    //hasCellar: false,
    //hasGarden: true,
    //hasGuestToilet: false,
    //hasLift: true,
    heating_costs: 'heatingCosts',
    heatingType: this.composeHeatingType,
    //interiorQuality: 'standard',
    //isAccessible: true,
    //isSuitableAsSharedFlat: false,
    //lastRefurbished: 2016,
    usable_area: 'livingArea',
    //locationDescription: 'My first location description for a property.',
    //miscellaneousDescription: 'My first misc description for a property.',
    bathrooms_number: 'numberOfBathrooms',
    bedrooms_number: 'numberOfBedrooms',
    number_floors: 'numberOfFloors',
    parking_space: 'numberOfParkingSpaces',
    rooms_number: 'numberOfRooms',
    //parkingSpaceRent: 45,
    parkingSpaceType: this.composeParkingSpaceType,
    pets_allowed: 'petsAllowed',
    //requiresWBS: false,
    /*
    residentialEnergyCertificate: {
      energyClass: 'A+',
      energyConsumption: 0.01,
      energyNeed: 0.01,
      energySource: 'solar',
      prior2014: false,
      type: 'consumption',
      warmWaterIncluded: true,
    },*/
    title: this.composeTitle,
    //'totalRent',
    area: 'usableArea',
  }

  constructor(apiKey = '') {
    this.apiKey = apiKey
    this.axios = axios.create({
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
  }

  composeHeatingType({ heating_type }) {
    const heatingType = invert(EstateSync.heatingType)
    if (heatingType[heating_type]) {
      return heatingType[heating_type]
    }
  }

  composeCondition({ building_status }) {
    const condition = invert(this.condition)
    return condition[building_status] ?? ''
  }

  composeDeposit({ deposit, net_rent }) {
    if (!deposit || !net_rent) {
      return ''
    }
    const num = deposit / net_rent
    return `${num}x base rent`
  }

  composeAddress(estate) {
    const address = {
      city: estate.city,
      postalCode: estate.zip,
      publish: estate.full_address,
      street: estate.street,
      streetNumber: estate.house_number,
    }
    return address
  }

  composeTitle(estate) {
    return 'Beautiful Estate'
  }

  composeEstate(estate) {
    let newEstate
    for (const [key, value] of Object.entries(this.map)) {
      if (isFunction(value)) {
        newEstate = { ...newEstate, [key]: value(estate) }
      } else if (this.makeNumeric.indexOf(value) > -1) {
        newEstate = { ...newEstate, [value]: Number(estate[key]) }
      } else if (this.makeBoolean.indexOf(value) > -1) {
        newEstate = { ...newEstate, [value]: estate[key] === true }
      } else {
        newEstate = { ...newEstate, [value]: estate[key] }
      }
    }

    for (let i = 0; i < this.mustHaveValue.length; i++) {
      if (!newEstate[this.mustHaveValue[i]]) {
        delete newEstate[this.mustHaveValue[i]]
      }
    }
    //newEstate.address = this.composeAddress(estate)
    //newEstate.heatingType = this.composeHeatingType(estate)
    return newEstate
  }

  composeParkingSpaceType(estate) {
    return 'garage'
  }

  async postEstate({
    type = 'apartmentRent',
    fields,
    attachments = [],
    contactId = '',
    externalId = '',
  }) {
    try {
      const ret = await this.axios.post('https://api.estatesync.com/properties', {
        type,
        fields,
        attachments,
        externalId,
      })
      return ret
    } catch (err) {
      console.log(err)
      return err.message
    }
  }

  deleteEstate() {}
}

module.exports = EstateSync
