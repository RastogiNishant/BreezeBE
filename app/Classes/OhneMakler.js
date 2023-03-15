const { STATUS_ACTIVE, THIRD_PARTY_OFFER_SOURCE_OHNE_MAKLER } = require('../constants')
const { isEmpty } = require('lodash')
const ESTATE_TYPE_VALUE_TO_QUALIFY = 'for rent'
const ESTATE_OBJEKTART_TO_QUALIFY = 'Wohnung'

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
    //levels: 'floor_count',
    bathrooms: 'bathrooms',
    rooms: 'rooms',
    floor_area: 'area',
    year: 'construction_year',
    pictures: 'images',
    expiration_date: 'expiration_date',
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
      newEstate.rent_start = estate.uebernahme_ab
    }

    newEstate.energy_efficiency_class = estate?.energieausweis?.energieeffizienzklasse
    return newEstate
  }

  estateCanBeProcessed(estate) {
    return (
      estate.type === ESTATE_TYPE_VALUE_TO_QUALIFY &&
      estate.objektart === ESTATE_OBJEKTART_TO_QUALIFY
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
