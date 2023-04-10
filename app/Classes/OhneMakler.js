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
  BUILDING_STATUS_IN_NEED_OF_RENOVATION,
  BUILDING_STATUS_NEW,
  BUILDING_STATUS_MODERNIZED,
  BUILDING_STATUS_FIRST_TIME_OCCUPIED,
  BUILDING_STATUS_BY_AGREEMENT,
  BUILDING_STATUS_FULLY_RENOVATED,
  BUILDING_STATUS_CLEANED,
  BUILDING_STATUS_WELL_MAINTAINED,
  BUILDING_STATUS_FIRST_TENANT_AFTER_RENOVATION,
  DATE_FORMAT,
  STATUS_EXPIRE,
} = require('../constants')
const { isEmpty } = require('lodash')
const moment = require('moment')

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
    price: 'net_rent',
    floor_count: 'number_floors',
    rooms: 'rooms_number',
    vacant_from: 'vacant_date',
    expiration_date: 'available_end_at',
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
    try {
      for (const [key, value] of Object.entries(this.map)) {
        newEstate = { ...newEstate, [value]: estate[key] }
      }
      newEstate.source = THIRD_PARTY_OFFER_SOURCE_OHNE_MAKLER
      newEstate.address = `${estate.address}, ${estate.postcode} ${estate.city}, ${estate.country}`

      if (estate?.pictures && !Array.isArray(estate?.pictures)) {
        estate.pictures = [estate?.pictures]
      }
      newEstate.images = estate?.pictures?.length ? JSON.stringify(estate.pictures) : null

      if (!isEmpty(estate.ausstattung)) {
        newEstate.amenities = estate.ausstattung.split(', ')
      }
      newEstate.status = STATUS_ACTIVE
      newEstate.coord = `${estate.latitude},${estate.longitude}`
      newEstate.coord_raw = `${estate.latitude},${estate.longitude}`
      if (estate.uebernahme_ab && estate.uebernahme_ab.match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
        newEstate.vacant_date = moment
          .utc(estate.uebernahme_ab, 'YYYY/MM/DD', true)
          .format(DATE_FORMAT)
      } else {
        newEstate.vacant_date = moment.utc(new Date()).format(DATE_FORMAT)
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

      if (!newEstate.extra_costs && newEstate.additional_costs && newEstate.heating_costs) {
        //extra costs is the sum of additional_costs and heating_costs
        newEstate.extra_costs = +newEstate.additional_costs + +newEstate.heating_costs
      }

      if (estate?.expiration_date) {
        newEstate.available_end_at = moment
          .utc(estate.expiration_date, 'YYYY/MM/DD', true)
          .add(1, 'day')
          .format(DATE_FORMAT)
      }

      if (
        !newEstate?.available_end_at ||
        newEstate.available_end_at > moment.utc(new Date()).format(DATE_FORMAT)
      ) {
        newEstate.status = STATUS_ACTIVE
      } else {
        console.log('expire estate=', estate.id)
        newEstate.status = STATUS_EXPIRE
      }
    } catch (e) {
      console.log('e.estate', estate)
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
    try {
      const processableEstates = estates.reduce((current, estate) => {
        if (this.estateCanBeProcessed(estate)) {
          estate = this.mapEstate(estate)
          if (estate) {
            return [...current, estate]
          }
          return current
        } else {
          return current
        }
      }, [])
      return processableEstates
    } catch (e) {
      console.log('OhneMakler error', e.message)
      return null
    }
  }
}

module.exports = OhneMakler
