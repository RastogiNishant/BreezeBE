'use strict'

const { test, before } = use('Test/Suite')('Estate Import')
const EstateImportReader = use('App/Classes/EstateImportReader')
const path = require('path')
const reader = new EstateImportReader(path.resolve('./test/unit/files/test.xlsx'))

before(async () => {})

test(`EstateImportReader.escapeStr changes non alphabet to underscores(_)`, async ({ assert }) => {
  const testStrings = ['abc def', 'abc1def', 'abc  def', 'straße']
  const expected = ['abc_def', 'abc_def', 'abc__def', 'stra_e']
  testStrings.map((str, index) => {
    assert.equal(reader.escapeStr(str), expected[index])
  })
})

test(`EstateImportReader.escapeStr trims leading and lagging spaces`, async ({ assert }) => {
  const testStrings = [' abc', 'abc ', ' abc ']
  const expected = 'abc'
  testStrings.map((str) => {
    assert.equal(reader.escapeStr(str), expected)
  })
})

test(`EstateImportReader.escapeStr makes uppercase chars to lowercase`, async ({ assert }) => {
  const testStrings = ['Abc', 'aBc', 'abC', 'ABC', 'aBC']
  const expected = 'abc'
  testStrings.map((str) => {
    assert.equal(reader.escapeStr(str), expected)
  })
})

test(`EstateImportReader.setValidColumns returns object of valid columns`, async ({ assert }) => {
  const testColumns = [
    'six_char_code',
    'property_id',
    'not_a_valid_column',
    'another_invalid_column',
  ]
  const expected = [
    { name: 'six_char_code', index: 0 },
    { name: 'property_id', index: 1 },
  ]
  const validColumns = reader.setValidColumns(testColumns)
  assert.deepEqual(validColumns, expected)
})

test(`EstateImportReader.setValidColumns returns object containing the correct index`, async ({
  assert,
}) => {
  const testColumns = [
    'six_char_code',
    'not_a_valid_column',
    'property_id',
    'another_invalid_column',
  ]
  const expected = [
    { name: 'six_char_code', index: 0 },
    { name: 'property_id', index: 2 },
  ]
  const validColumns = reader.setValidColumns(testColumns)
  assert.deepEqual(validColumns, expected)
})
