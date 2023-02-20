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
    levels: 'floor_number',
    bathrooms: 'bathrooms',
    rooms: 'rooms',
    area_living: 'area',
    year: 'construction_year',
    pictures: 'images',
    //table.string('energy_efficiency_class', 5)
    //table.date('rent_start')
    //table.date('visit_from')
    //table.date('visit_to')
    //table.timestamps()
    //table.unique(['source', 'source_id'])
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
    newEstate.images = estate.pictures
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
