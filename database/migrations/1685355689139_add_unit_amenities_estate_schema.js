'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Option = use('App/Models/Option')
const unitAmenities = [
  'apartment.amenities.Apartment.OneIntermediatecleaning',
  'apartment.amenities.Apartment.Twointermediatecleanings',
  'apartment.amenities.Apartment.Singlebed',
  'apartment.amenities.Apartment.Doublebed',
  'apartment.amenities.Apartment.forOneperson',
  'apartment.amenities.Apartment.forTwopersons',
  'apartment.amenities.Apartment.spacious',
  'apartment.amenities.Apartment.Washer-dryer',
  'apartment.amenities.Apartment.Finalcleaning',
  'apartment.amenities.Apartment.Washingmachine',
  'apartment.amenities.Apartment.Coffeemachine',
  'apartment.amenities.Apartment.Air-conditioned',
  'apartment.amenities.Apartment.Comfortablecouch',
  'apartment.amenities.Apartment.Spatialseparation',
  'apartment.amenities.Apartment.Spaciousroomcuts',
  'apartment.amenities.Apartment.WLAN',
  'apartment.amenities.Apartment.SmartTV',
  'apartment.amenities.Apartment.Kitchen',
  'apartment.amenities.Apartment.Microwaveoven',
  'apartment.amenities.Apartment.Iron',
  'apartment.amenities.Apartment.Hairdryer',
  'apartment.amenities.Apartment.Elevator',
  'apartment.amenities.Apartment.Non-smoking',
  'apartment.amenities.Apartment.Intercom',
  'apartment.amenities.Apartment.RefrigeratorMinibar',
  'apartment.amenities.Apartment.Securityguard',
  'apartment.amenities.Apartment.Heating',
  'apartment.amenities.Apartment.Firstaidkit',
  'apartment.amenities.Apartment.Airconditioning',
  'apartment.amenities.Apartment.Petsallowed',
  'apartment.amenities.Apartment.Smokedetector',
  'apartment.amenities.Apartment.Familyfriendly',
  'apartment.amenities.Apartment.Carbonmonoxidedetector',
  'apartment.amenities.Apartment.Laminate',
  'apartment.amenities.Apartment.Parquet',
  'apartment.amenities.Apartment.Showerbath',
  'apartment.amenities.Apartment.Dishwasher',
  'apartment.amenities.Apartment.Electrickettle',
  'apartment.amenities.Apartment.Fireextinguisher',
  'apartment.amenities.Apartment.Towels',
  'apartment.amenities.Apartment.Accessibleforelderly',
  'apartment.amenities.Apartment.Barrier-free',
  'apartment.amenities.Apartment.Toaster',
  'apartment.amenities.Apartment.Sharedkitchen',
  'apartment.amenities.Apartment.Sharedbathroom',
  'apartment.amenities.Apartment.Separatebeds',
  'apartment.amenities.Apartment.Printer',
  'apartment.amenities.Apartment.Vacuumcleaner',
  'apartment.amenities.Apartment.Espressomachine',
  'apartment.amenities.Apartment.Glasses_Dishes',
]

class AddUnitAmenitiesEstateSchema extends Schema {
  async up() {
    const lastUnitTypeOption = await Option.query()
      .where('type', 'apt')
      .orderBy('order', 'desc')
      .first()
    const lastOrderNumber = lastUnitTypeOption.order
    const optionsToBeAdded = unitAmenities.reduce((optionsToBeAdded, amenity, index) => {
      return [
        ...optionsToBeAdded,
        { title: amenity, type: 'apt', order: lastOrderNumber + index * 10 },
      ]
    }, [])
    await Option.createMany(optionsToBeAdded)
  }

  down() {}
}

module.exports = AddUnitAmenitiesEstateSchema
