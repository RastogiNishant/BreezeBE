'use strict'

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
