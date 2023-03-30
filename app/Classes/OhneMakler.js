const {
  STATUS_ACTIVE,
  THIRD_PARTY_OFFER_SOURCE_OHNE_MAKLER,
  OHNE_MAKLER_ESTATE_OBJEKTART_TO_QUALIFY,
  OHNE_MAKLER_ESTATE_TYPE_VALUE_TO_QUALIFY,
  PROPERTY_TYPE_APARTMENT,
  PROPERTY_TYPE_ROOM,
  PROPERTY_TYPE_HOUSE,
  PROPERTY_TYPE_SHORT_TERM,
  BUILDING_STATUS_IN_NEED_OF_RENOVATION,
  BUILDING_STATUS_NEW,
  BUILDING_STATUS_MODERNIZED,
  BUILDING_STATUS_FIRST_TIME_OCCUPIED,
  BUILDING_STATUS_BY_AGREEMENT,
  BUILDING_STATUS_FULLY_RENOVATED,
  BUILDING_STATUS_CLEANED,
  BUILDING_STATUS_WELL_MAINTAINED,
  BUILDING_STATUS_FIRST_TENANT_AFTER_RENOVATION,
} = require('../constants')
const { isEmpty } = require('lodash')

class OhneMakler {
  map = {
    id: 'source_id',
    title: 'description',
    url: 'url',
    address: 'street',
    city: 'city',
    postcode: 'zip',
    country: 'country',
    floor_number: 'floor',
    floor_count: 'floor_count',
    bathrooms: 'bathrooms',
    rooms: 'rooms',
    floor_area: 'area',
    year: 'construction_year',
    pictures: 'images',
    expiration_date: 'expiration_date',
    price: 'price',
    contact: 'contact',
    address_public: 'full_address',
    nebenkosten_ohne_heizkosten: 'additional_costs',
    heizkosten: 'heating_costs',
    summe_nebenkosten: 'extra_costs',
    //visit_from
    //visit_to
  }

  constructor(data) {
    this.data = data
  }

  parsePropertyType(propertyType) {
    switch (propertyType) {
      case 'Wohnung':
        return PROPERTY_TYPE_APARTMENT
      case 'Haus':
        return PROPERTY_TYPE_HOUSE
      case 'Möbliertes Wohnen / Wohnen auf Zeit':
        return PROPERTY_TYPE_SHORT_TERM
      case 'Zimmer':
        return PROPERTY_TYPE_ROOM
    }
    return null
  }

  parseBuildingStatus(buildingStatus) {
    switch (buildingStatus) {
      case 'nach Vereinbarung':
        return BUILDING_STATUS_BY_AGREEMENT
      case 'renovierungsbedürftig':
        return BUILDING_STATUS_IN_NEED_OF_RENOVATION
      case 'Erstbezug nach Sanierung':
        return BUILDING_STATUS_FIRST_TENANT_AFTER_RENOVATION
      case 'saniert':
        return BUILDING_STATUS_CLEANED
      case 'gepflegt':
        return BUILDING_STATUS_WELL_MAINTAINED
      case 'keine Angaben':
        return null
      case 'Erstbezug':
        return BUILDING_STATUS_FIRST_TIME_OCCUPIED
      case 'modernisiert':
        return BUILDING_STATUS_MODERNIZED
      case 'renoviert':
        return BUILDING_STATUS_FULLY_RENOVATED
      case 'Neuwertig':
        return BUILDING_STATUS_NEW
    }
    return null
  }

  mapEstate(estate) {
    let newEstate
    for (const [key, value] of Object.entries(this.map)) {
      newEstate = { ...newEstate, [value]: estate[key] }
    }
    newEstate.source = THIRD_PARTY_OFFER_SOURCE_OHNE_MAKLER
    newEstate.address = `${estate.address}, ${estate.postcode} ${estate.city}, ${estate.country}`
    newEstate.images = JSON.stringify(estate.pictures)
    if (!isEmpty(estate.ausstattung)) {
      newEstate.amenities = estate.ausstattung.split(', ')
    }
    newEstate.status = STATUS_ACTIVE
    newEstate.coord = `${estate.latitude},${estate.longitude}`
    newEstate.coord_raw = `${estate.latitude},${estate.longitude}`
    if (estate.uebernahme_ab && estate.uebernahme_ab.match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
      newEstate.vacant_from = estate.uebernahme_ab
    } else {
      newEstate.vacant_from_string = estate.uebernahme_ab
    }

    //as confirmed by andrey, K is Kellergeschoss (basement or underground)
    if (newEstate.floor === 'K') {
      newEstate.floor = -1
    }
    //11 here means greater than 5
    if (newEstate.floor === '>') {
      newEstate.floor = 11
    }
    newEstate.energy_efficiency_class = estate?.energieausweis?.energieeffizienzklasse
    newEstate.property_type = this.parsePropertyType(estate.objektart)
    newEstate.building_status = this.parseBuildingStatus(estate.condition)
    if (!newEstate.extra_costs && newEstate.additional_costs && newEstate.heating_costs) {
      //extra costs is the sum of additional_costs and heating_costs
      newEstate.extra_costs = +newEstate.additional_costs + +newEstate.heating_costs
    }
    return newEstate
  }

  estateCanBeProcessed(estate) {
    return (
      estate.type === OHNE_MAKLER_ESTATE_TYPE_VALUE_TO_QUALIFY &&
      OHNE_MAKLER_ESTATE_OBJEKTART_TO_QUALIFY.includes(estate.objektart)
    )
  }

  process(estates = null) {
    if (!estates) {
      estates = this.data
    }
    const processableEstates = estates.reduce((current, estate) => {
      if (this.estateCanBeProcessed(estate)) {
        estate = this.mapEstate(estate)
        return [...current, estate]
      } else {
        return current
      }
    }, [])
    return processableEstates
  }
}

module.exports = OhneMakler
