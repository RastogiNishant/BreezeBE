'use strict'

const {
  HOUSE_TYPE_HIGH_RISE,
  APARTMENT_TYPE_ATTIC,
  HOUSE_TYPE_COUNTRY,
  PROPERTY_TYPE_APARTMENT,
} = require('../../app/constants')

const { test } = use('Test/Suite')('Class Ohnemakler')
const OhneMakler = use('App/Classes/OhneMakler')

test('estateCanBeProcessed will return false if estate type is wrong', async ({ assert }) => {
  const ohneMakler = new OhneMakler()
  const estateToTest = {
    type: 'not for rent',
    objektart: 'value',
  }
  assert.equal(ohneMakler.estateCanBeProcessed(estateToTest), false)
})

test('estateCanBeProcessed will return false if objektart is wrong', async ({ assert }) => {
  const ohneMakler = new OhneMakler()
  const estateToTest = {
    type: 'for rent',
    objektart: 'wrong value',
  }
  assert.equal(ohneMakler.estateCanBeProcessed(estateToTest), false)
})

test('estateCanBeProcessed will return false if objektart is wrong', async ({ assert }) => {
  const ohneMakler = new OhneMakler()
  const estateToTest = {
    type: 'for rent',
    objektart: 'Wohnung',
  }
  assert.equal(ohneMakler.estateCanBeProcessed(estateToTest), true)
})

test('parseItemType will return null if type does not exist', async ({ assert }) => {
  const ohneMakler = new OhneMakler()
  assert.equal(ohneMakler.parseItemType('none', 'non-existing-type'), null)
})

test('parseItemType will return null if value does not exist', async ({ assert }) => {
  const ohneMakler = new OhneMakler()
  assert.equal(ohneMakler.parseItemType('none-existing-value', 'propertyType'), null)
})

test('parseHouseAndApartmentTypes returns expected newEstate', async ({ assert }) => {
  const ohneMakler = new OhneMakler()
  const testEstates = [
    { property_type: 'Mehrfamilienhaus', objekttyp: 'Mehrfamilienhaus' },
    { property_type: 'Mehrfamilienhaus', objekttyp: 'Dachgeschosswohnung' },
    { property_type: 'Dachgeschosswohnung', objekttyp: 'Stadthaus' },
    { property_type: 'Non-existing type' },
    { objekttyp: 'Non-existing type' },
    { property_type: 'Non-existing type', objekttyp: 'Non-existing type' },
    { property_type: 'Etagenwohnung' },
  ]

  const expectedEstates = [
    { house_type: HOUSE_TYPE_HIGH_RISE },
    { house_type: HOUSE_TYPE_HIGH_RISE, apt_type: APARTMENT_TYPE_ATTIC },
    { house_type: HOUSE_TYPE_COUNTRY, apt_type: APARTMENT_TYPE_ATTIC },
    {},
    {},
    {},
    { property_type: PROPERTY_TYPE_APARTMENT },
  ]
  for (let i = 0; i < testEstates.length; i++) {
    assert.deepEqual(ohneMakler.parseHouseAndApartmentTypes(testEstates[i], {}), expectedEstates[i])
  }
})
