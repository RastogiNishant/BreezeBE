const {
  STATUS_ACTIVE,
  THIRD_PARTY_OFFER_SOURCE_OHNE_MAKLER,
  OHNE_MAKLER_ESTATE_OBJEKTART_TO_QUALIFY,
  OHNE_MAKLER_ESTATE_TYPE_VALUE_TO_QUALIFY,
  HOUSE_TYPE_SEMIDETACHED_HOUSE,
  HOUSE_TYPE_DETACHED_HOUSE,
  HOUSE_TYPE_GARDENHOUSE,
  HOUSE_TYPE_COUNTRY,
  PROPERTY_TYPE_APARTMENT,
  PROPERTY_TYPE_ROOM,
  PROPERTY_TYPE_HOUSE,
  PROPERTY_TYPE_SHORT_TERM,
  BUILDING_STATUS_IN_NEED_OF_RENOVATION,
  BUILDING_STATUS_NEW,
  BUILDING_STATUS_MODERNIZED,
  BUILDING_STATUS_FIRST_TIME_OCCUPIED,
  BUILDING_STATUS_BY_AGREEMENT,
  BUILDING_STATUS_PART_FULLY_RENOVATED,
  BUILDING_STATUS_CLEANED,
  DATE_FORMAT,
  STATUS_EXPIRE,
  HOUSE_TYPE_HIGH_RISE,
  APARTMENT_TYPE_ATTIC,
  APARTMENT_TYPE_TERRACES,
  APARTMENT_TYPE_PENTHOUSE,
  APARTMENT_TYPE_MAISONETTE,
  APARTMENT_TYPE_SOUTERRAIN,
  APARTMENT_TYPE_GROUND,
  HOUSE_TYPE_2FAMILY_HOUSE,
  HOUSE_TYPE_BUNGALOW,
  APARTMENT_TYPE_LOFT,
  BUILDING_STATUS_EXISTING,
  THIRD_PARTY_OFFER_HOUSE_TYPE,
  THIRD_PARTY_OFFER_APARTMENT_TYPE,
  THIRD_PARTY_OFFER_PROPERTY_TYPE,
  HEATING_TYPE_CENTRAL,
  HEATING_TYPE_OVEN,
  HEATING_TYPE_FLOOR,
  HEATING_TYPE_MISC,
  HEATING_TYPE_UNDERFLOOR,
  FIRING_WOOD,
  FIRING_AIRWP,
  FIRING_PELLET,
  FIRING_REMOTE,
  FIRING_OEL,
  FIRING_ELECTRIC,
  FIRING_GROUND_HEAT,
  FIRING_GAS,
  THIRD_PARTY_OFFER_PROVIDER_INFORMATION,
} = require('../constants')
const { isEmpty, groupBy } = require('lodash')
const moment = require('moment')

class OhneMakler {
  propertyType = {
    Wohnung: PROPERTY_TYPE_APARTMENT,
    Haus: PROPERTY_TYPE_HOUSE,
    'Möbliertes Wohnen / Wohnen auf Zeit': PROPERTY_TYPE_SHORT_TERM,
    Zimmer: PROPERTY_TYPE_ROOM,
  }

  buildingStatus = {
    'nach Vereinbarung': BUILDING_STATUS_BY_AGREEMENT,
    renovierungsbedürftig: BUILDING_STATUS_IN_NEED_OF_RENOVATION,
    'Erstbezug nach Sanierung': BUILDING_STATUS_FIRST_TIME_OCCUPIED,
    saniert: BUILDING_STATUS_CLEANED,
    gepflegt: BUILDING_STATUS_EXISTING,
    'keine Angaben': null,
    Erstbezug: BUILDING_STATUS_FIRST_TIME_OCCUPIED,
    modernisiert: BUILDING_STATUS_MODERNIZED,
    renoviert: BUILDING_STATUS_PART_FULLY_RENOVATED,
    Neuwertig: BUILDING_STATUS_NEW,
  }

  heatingType = {
    Zentralheizung: HEATING_TYPE_CENTRAL,
    Ofenheizung: HEATING_TYPE_OVEN,
    Sonstiges: HEATING_TYPE_MISC,
    Fußbodenheizung: HEATING_TYPE_UNDERFLOOR,
    Etagenheizung: HEATING_TYPE_FLOOR,
  }

  firing = {
    Holz: FIRING_WOOD,
    'Luft-/Wasserwärme': FIRING_AIRWP,
    Holzpellets: FIRING_PELLET,
    Fernwärme: FIRING_REMOTE,
    Öl: FIRING_OEL,
    Strom: FIRING_ELECTRIC,
    Erdwärme: FIRING_GROUND_HEAT,
    Gas: FIRING_GAS,
  }

  houseType = {
    Mehrfamilienhaus: {
      type: 'house_type',
      value: HOUSE_TYPE_HIGH_RISE,
    },
    Dachgeschosswohnung: {
      type: 'apt_type',
      value: APARTMENT_TYPE_ATTIC,
    },
    Reihenhaus: {
      type: 'apt_type',
      value: APARTMENT_TYPE_TERRACES,
    },
    Penthouse: {
      type: 'apt_type',
      value: APARTMENT_TYPE_PENTHOUSE,
    },
    Maisonette: {
      type: 'apt_type',
      value: APARTMENT_TYPE_MAISONETTE,
    },
    Etagenwohnung: {
      type: 'property_type',
      value: PROPERTY_TYPE_APARTMENT,
    },
    Bauernhof: {
      type: 'house_type',
      value: HOUSE_TYPE_GARDENHOUSE,
    },
    Studio: {
      type: 'apartment_type',
      value: APARTMENT_TYPE_LOFT,
    },
    Einfamilienhaus: {
      type: 'house_type',
      value: HOUSE_TYPE_DETACHED_HOUSE,
    },
    Doppelhaushälfte: {
      type: 'house_type',
      value: HOUSE_TYPE_SEMIDETACHED_HOUSE,
    },
  }

  apartmentType = {
    Stadthaus: {
      type: 'house_type',
      value: HOUSE_TYPE_COUNTRY,
    },
    Bauernhaus: {
      type: 'house_type',
      value: HOUSE_TYPE_GARDENHOUSE,
    },
    Zweifamilienhaus: {
      type: 'house_type',
      value: HOUSE_TYPE_2FAMILY_HOUSE,
    },
    Appartement: {
      type: 'property_type',
      value: PROPERTY_TYPE_APARTMENT,
    },
    Dachgeschosswohnung: {
      type: 'apt_type',
      value: APARTMENT_TYPE_ATTIC,
    },
    'Loft, Studio, Atelier': {
      type: 'apartment_type',
      value: APARTMENT_TYPE_LOFT,
    },
    Penthouse: {
      type: 'apt_type',
      value: APARTMENT_TYPE_PENTHOUSE,
    },
    Maisonette: {
      type: 'apt_type',
      value: APARTMENT_TYPE_MAISONETTE,
    },
    'Laube, Datsche, Gartenhaus': {
      type: 'house_type',
      value: HOUSE_TYPE_GARDENHOUSE,
    },
    Einfamilienhaus: {
      type: 'house_type',
      value: HOUSE_TYPE_DETACHED_HOUSE,
    },
    Souterrainwohnung: {
      type: 'apt_type',
      value: APARTMENT_TYPE_SOUTERRAIN,
    },
    Doppelhaushälfte: {
      type: 'house_type',
      value: HOUSE_TYPE_SEMIDETACHED_HOUSE,
    },
    Reihenendhaus: {
      type: 'apt_type',
      value: APARTMENT_TYPE_TERRACES,
    },
    Erdgeschosswohnung: {
      type: 'apt_type',
      value: APARTMENT_TYPE_GROUND,
    },
    Mehrfamilienhaus: {
      type: 'house_type',
      value: HOUSE_TYPE_HIGH_RISE,
    },
    Terrassenwohnung: {
      type: 'apt_type',
      value: APARTMENT_TYPE_TERRACES,
    },
    Zimmer: {
      type: 'property_type',
      value: PROPERTY_TYPE_ROOM,
    },
    Wohnung: {
      type: 'property_type',
      value: PROPERTY_TYPE_APARTMENT,
    },
    Reihenhaus: {
      type: 'apt_type',
      value: APARTMENT_TYPE_TERRACES,
    },
    Haus: {
      type: 'property_type',
      value: PROPERTY_TYPE_HOUSE,
    },
    Bungalow: {
      type: 'house_type',
      value: HOUSE_TYPE_BUNGALOW,
    },
    Etagenwohnung: {
      type: 'property_type',
      value: PROPERTY_TYPE_APARTMENT,
    },
  }

  static amenities = {
    apt_balcony: 'Balkon',
    apt_wainscoting: 'Terrasse',
    fitted_kitchen: 'Einbauküche',
    apt_low_barrier_cut: 'Barrierefrei',
    cellar: 'Keller',
    garden: 'Garten',
    apt_fireplace: 'Kamin',
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
    price: 'net_rent',
    floor_count: 'number_floors',
    rooms: 'rooms_number',
    vacant_from: 'vacant_date',
    vacant_till: 'rent_end_at',
    expiration_date: 'available_end_at',
    duration_rent_min: 'duration_rent_min',
    duration_rent_max: 'duration_rent_max',
    energietraeger: 'firing',
    //visit_from
    //visit_to
  }

  constructor(data) {
    this.data = data
  }

  parseItemType({ key, type }) {
    if (typeof this[type] === 'undefined') {
      return null
    }
    if (typeof this[type][key] === 'undefined') {
      return null
    }
    return this[type][key]
  }

  static getOptionIds(amenities, hashOptions) {
    if (!amenities?.length) {
      return []
    }

    const amenityKeys = amenities.map((amenity) => {
      return (
        Object.keys(OhneMakler.amenities).find((key) => OhneMakler.amenities[key] === amenity) ?? ''
      )
    })

    return amenityKeys.map((key) => hashOptions?.[key]?.[0].id ?? 0)
  }

  parseHouseAndApartmentTypes(estate, newEstate) {
    //house_type
    if (
      this.houseType[estate.property_type] &&
      this.houseType[estate.property_type].type === THIRD_PARTY_OFFER_HOUSE_TYPE
    ) {
      newEstate['house_type'] = this.houseType[estate.property_type].value
    } else if (
      this.houseType[estate.property_type] &&
      this.houseType[estate.property_type].type === THIRD_PARTY_OFFER_APARTMENT_TYPE
    ) {
      newEstate['apt_type'] = this.houseType[estate.property_type].value
    } else if (
      this.houseType[estate.property_type] &&
      this.houseType[estate.property_type].type === THIRD_PARTY_OFFER_PROPERTY_TYPE
    ) {
      if (!newEstate.property_type) {
        newEstate['property_type'] = this.houseType[estate.property_type].value
      }
    }

    //apt_type
    if (
      this.apartmentType[estate.objekttyp] &&
      this.apartmentType[estate.objekttyp].type === THIRD_PARTY_OFFER_APARTMENT_TYPE
    ) {
      newEstate['apt_type'] = this.apartmentType[estate.objekttyp].value
    } else if (
      this.apartmentType[estate.objekttyp] &&
      this.apartmentType[estate.objekttyp].type === THIRD_PARTY_OFFER_HOUSE_TYPE
    ) {
      if (!newEstate.house_type) {
        newEstate['house_type'] = this.apartmentType[estate.objekttyp].value
      }
    } else if (
      this.apartmentType[estate.objekttyp] &&
      this.apartmentType[estate.objekttyp].type === THIRD_PARTY_OFFER_PROPERTY_TYPE
    ) {
      if (!newEstate.property_type) {
        newEstate['property_type'] = this.apartmentType[estate.objekttyp].value
      }
    }
    return newEstate
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
      newEstate.images = estate?.pictures?.length
        ? JSON.stringify(estate.pictures)
        : JSON.stringify([
            {
              picture: {
                picture_url:
                  'https://cdn4.vectorstock.com/i/1000x1000/21/23/isolated-avatar-man-and-house-design-vector-25982123.jpg',
                picture_title: 'Außenansicht ',
              },
            },
          ])
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

      if (estate?.pictures && !Array.isArray(estate?.pictures)) {
        estate.pictures = [estate?.pictures]
      }
      newEstate.images = estate?.pictures?.length ? JSON.stringify(estate.pictures) : null

      if (!isEmpty(estate.ausstattung)) {
        newEstate.amenities = estate.ausstattung.split(', ')
      }

      newEstate.coord = `${estate.latitude},${estate.longitude}`
      newEstate.coord_raw = `${estate.latitude},${estate.longitude}`
      if (estate.uebernahme_ab && estate.uebernahme_ab.match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
        newEstate.vacant_date = moment(estate.uebernahme_ab, 'YYYY/MM/DD', true)
          .utcOffset(2)
          .format(DATE_FORMAT)
      } else {
        newEstate.vacant_date = moment.utc(new Date()).format(DATE_FORMAT)
        newEstate.vacant_from_string = estate.uebernahme_ab
      }

      newEstate.rent_end_at = estate?.vacant_till
        ? moment(estate.vacant_till, 'YYYY/MM/DD', true).utcOffset(2).format(DATE_FORMAT)
        : null
      //as confirmed by andrey, K is Kellergeschoss (basement or underground)
      if (newEstate.floor === 'K') {
        newEstate.floor = -1
      }
      //11 here means greater than 5
      if (newEstate.floor === '>') {
        newEstate.floor = 11
      }
      newEstate.energy_efficiency_class = estate?.energieausweis?.energieeffizienzklasse
      newEstate.property_type = this.parseItemType({ type: 'propertyType', key: estate.objektart })
      newEstate.building_status = this.parseItemType({
        key: estate.condition,
        type: 'buildingStatus',
      })
      newEstate.heating_type = this.parseItemType({ type: 'heatingType', key: estate.heizung })
      newEstate.firing = this.parseItemType({ type: 'firing', key: estate.energietraeger })
      newEstate = this.parseHouseAndApartmentTypes(estate, newEstate)

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
        newEstate.available_end_at > moment(new Date()).utcOffset(2).format(DATE_FORMAT)
      ) {
        newEstate.status = STATUS_ACTIVE
      } else {
        newEstate.status = STATUS_EXPIRE
      }
      newEstate.source_information = THIRD_PARTY_OFFER_PROVIDER_INFORMATION['ohnemakler']
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
