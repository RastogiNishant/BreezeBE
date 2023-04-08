const {
  STATUS_ACTIVE,
  THIRD_PARTY_OFFER_SOURCE_OHNE_MAKLER,
  OHNE_MAKLER_ESTATE_OBJEKTART_TO_QUALIFY,
  OHNE_MAKLER_ESTATE_TYPE_VALUE_TO_QUALIFY,
  HOUSE_TYPE_SEMIDETACHED_HOUSE,
  HOUSE_TYPE_DETACHED_HOUSE,
  HOUSE_TYPE_STUDIO,
  HOUSE_TYPE_GARDENHOUSE,
  PROPERTY_TYPE_APARTMENT,
  PROPERTY_TYPE_ROOM,
  PROPERTY_TYPE_HOUSE,
  PROPERTY_TYPE_SHORT_TERM,
} = require('../constants')
const { isEmpty } = require('lodash')

class OhneMakler {
  propertyType = {
    Wohnung: PROPERTY_TYPE_APARTMENT,
    Haus: PROPERTY_TYPE_HOUSE,
    'Möbliertes Wohnen / Wohnen auf Zeit': PROPERTY_TYPE_SHORT_TERM,
    Zimmer: PROPERTY_TYPE_ROOM,
  }
  houseType = {
    'Mehrfamilienhaus': 
    'Dachgeschosswohnung': 
    'Reihenhaus': 
    'Penthouse': 
    'Maisonette': 
    'Etagenwohnung': 
    'Bauernhof': HOUSE_TYPE_GARDENHOUSE,
    'Studio': HOUSE_TYPE_STUDIO,
    'Einfamilienhaus': HOUSE_TYPE_DETACHED_HOUSE,
    'Doppelhaushälfte': HOUSE_TYPE_SEMIDETACHED_HOUSE1``
  }
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
    property_type: 'house_type',
    objekttyp: 'apt_type',
    //visit_from
    //visit_to
  }

  constructor(data) {
    this.data = data
  }

  parseItemType({key, type}) {
    if (typeof this[type] === 'undefined') {
      return null
    }
    if (typeof this[type][key] === 'undefined') {
      return null
    }
    return this[type][key]
  }
  
  parseHouseType(houseType) {
    switch (houseType) {
      case 'Mehrfamilienhaus':
        return
      case 'Dachgeschosswohnung':
        return
      case 'Reihenhaus':
        return
      case 'Penthouse':
        return
      case 'Maisonette':
        return HOUSE_TYPE_DUPLEX
      case 'Etagenwohnung':
        return
      case 'Bauernhof':
        return HOUSE_TYPE_GARDENHOUSE
      case 'Studio':
        return HOUSE_TYPE_STUDIO
      case 'Einfamilienhaus':
        return HOUSE_TYPE_DETACHED_HOUSE
      case 'Doppelhaushälfte':
        return HOUSE_TYPE_SEMIDETACHED_HOUSE
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
    newEstate.property_type = this.parseItem(estate.objektart, 'propertyType')

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
