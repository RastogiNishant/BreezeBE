const {
  STATUS_ACTIVE,
  THIRD_PARTY_OFFER_SOURCE_OHNE_MAKLER,
  OHNE_MAKLER_ESTATE_OBJEKTART_TO_QUALIFY,
  OHNE_MAKLER_ESTATE_TYPE_VALUE_TO_QUALIFY,
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
    //visit_from
    //visit_to
  }

  constructor(data) {
    this.data = data
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
    return newEstate
  }

  estateCanBeProcessed(estate) {
    return (
      estate.type === OHNE_MAKLER_ESTATE_TYPE_VALUE_TO_QUALIFY &&
      estate.objektart === OHNE_MAKLER_ESTATE_OBJEKTART_TO_QUALIFY
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
