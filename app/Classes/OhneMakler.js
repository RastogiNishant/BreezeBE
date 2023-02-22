const { STATUS_ACTIVE } = require('../constants')

class OhneMakler {
  map = {
    id: 'source_id',
    title: 'description',
    url: 'url',
    street: 'street',
    city: 'city',
    postcode: 'zip',
    country: 'country',
    floor: 'floor',
    levels: 'floor_count',
    bathrooms: 'bathrooms',
    rooms: 'rooms',
    area_living: 'area',
    year: 'construction_year',
    pictures: 'images',
    //rent_start
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
    newEstate.source = 'ohnemakler'
    newEstate.address = `${estate.street}, ${estate.postcode} ${estate.city}`
    newEstate.images = JSON.stringify(estate.pictures)
    newEstate.amenities = estate.facilities.split(', ')
    newEstate.status = STATUS_ACTIVE
    if (estate.coordinates) {
      newEstate.coord = `${estate.coordinates.lat},${estate.coordinates.lon}`
    }
    return newEstate
  }

  estateCanBeProcessed(estate) {
    return (
      estate.marketing === 'RENT' &&
      estate.objektart === 'Wohnung' &&
      estate.objekttyp === 'Mehrfamilienhaus'
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
      }
    }, [])
    return processableEstates
  }
}

module.exports = OhneMakler
