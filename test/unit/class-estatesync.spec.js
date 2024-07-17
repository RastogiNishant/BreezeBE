'use strict'
const { faker } = require('@faker-js/faker')
const { test } = use('Test/Suite')('Class EstateSync')
const {EstateSync} = use('App/Classes/EstateSync')
const { sample } = require('lodash')
const {
  BUILDING_STATUS_FIRST_TIME_OCCUPIED,
  BUILDING_STATUS_PART_COMPLETE_RENOVATION_NEED,
  BUILDING_STATUS_NEW,
  BUILDING_STATUS_EXISTING,
  BUILDING_STATUS_PART_FULLY_RENOVATED,
  BUILDING_STATUS_PARTLY_REFURISHED,
  BUILDING_STATUS_IN_NEED_OF_RENOVATION,
  BUILDING_STATUS_READY_TO_BE_BUILT,
  BUILDING_STATUS_BY_AGREEMENT,
  BUILDING_STATUS_MODERNIZED,
  BUILDING_STATUS_CLEANED,
  BUILDING_STATUS_ROUGH_BUILDING,
  BUILDING_STATUS_DEVELOPED,
  BUILDING_STATUS_ABRISSOBJEKT,
  BUILDING_STATUS_PROJECTED,
  BUILDING_STATUS_FULLY_REFURBISHED,
  HEATING_TYPE_NO,
  HEATING_TYPE_CENTRAL,
  HEATING_TYPE_FLOOR,
  HEATING_TYPE_REMOTE,
  HEATING_TYPE_OVEN,
} = require('../../app/constants')

test('composeAddress composes address from estate', async ({ assert }) => {
  const estateSync = new EstateSync()
  const estateToTest = {
    city: faker.address.city(),
    zip: faker.address.zipCode(),
    full_address: sample([true, false]),
    street: faker.address.street(),
    street_number: faker.random.numeric(2),
  }
  const expected = {
    city: estateToTest.city,
    postalCode: estateToTest.zip,
    publish: estateToTest.full_address,
    street: estateToTest.street,
    streetNumber: estateToTest.street_number,
  }
  assert.deepEqual(estateSync.composeAddress(estateToTest), expected)
})

test('composeHeatingType composes heatingType from estate.heating_type', async ({ assert }) => {
  const estateSync = new EstateSync()
  const heating_types = [
    HEATING_TYPE_NO,
    HEATING_TYPE_CENTRAL,
    HEATING_TYPE_FLOOR,
    HEATING_TYPE_REMOTE,
    HEATING_TYPE_OVEN,
  ]
  const heatingTypes = ['none', 'central', 'floor', 'remote', 'oven']
  heating_types.map((heating_type, index) => {
    assert.equal(estateSync.composeHeatingType({ heating_type }), heatingTypes[index])
  })
})

test('composeCondition composes condition from estate.building_status', async ({ assert }) => {
  const estateSync = new EstateSync()
  const building_statuses = [
    BUILDING_STATUS_FIRST_TIME_OCCUPIED,
    BUILDING_STATUS_PART_COMPLETE_RENOVATION_NEED,
    BUILDING_STATUS_NEW,
    BUILDING_STATUS_EXISTING,
    BUILDING_STATUS_PART_FULLY_RENOVATED,
    BUILDING_STATUS_PARTLY_REFURISHED,
    BUILDING_STATUS_IN_NEED_OF_RENOVATION,
    BUILDING_STATUS_READY_TO_BE_BUILT,
    BUILDING_STATUS_BY_AGREEMENT,
    BUILDING_STATUS_MODERNIZED,
    BUILDING_STATUS_CLEANED,
    BUILDING_STATUS_ROUGH_BUILDING,
    BUILDING_STATUS_DEVELOPED,
    BUILDING_STATUS_ABRISSOBJEKT,
    BUILDING_STATUS_PROJECTED,
    BUILDING_STATUS_FULLY_REFURBISHED,
  ]
  const conditions = [
    'first time occupied',
    'needs renovation',
    'new',
    'existing',
    'fully renovated',
    'partly refurbished',
    'in need of renovation',
    'ready to be built',
    'by agreement',
    'modernized',
    'cleaned',
    'rough building',
    'developed',
    'abrissobjekt',
    'projected',
    'refurbished',
  ]
  building_statuses.map((building_status, index) => {
    assert.equal(estateSync.composeCondition({ building_status }), conditions[index])
  })
})
