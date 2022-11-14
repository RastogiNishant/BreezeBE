'use strict'

const { test, before } = use('Test/Suite')('Estate Import')
const EstateImportReader = use('App/Classes/EstateImportReader')
const path = require('path')
const {
  LETTING_TYPE_NA,
  LETTING_TYPE_LET,
  LETTING_STATUS_NORMAL,
  LETTING_STATUS_DEFECTED,
  LETTING_STATUS_TERMINATED,
  LETTING_TYPE_VOID,
  LETTING_STATUS_FIRST_TIME_USE,
  LETTING_STATUS_CONSTRUCTION_WORKS,
  LETTING_STATUS_STRUCTURAL_VACANCY,
  LETTING_STATUS_VACANCY,
  ROOM_TYPE_LIVING_ROOM,
  ROOM_TYPE_GUEST_ROOM,
  ROOM_TYPE_STAIRS,
  ROOM_TYPE_BEDROOM,
  ROOM_TYPE_KITCHEN,
  ROOM_TYPE_BATH,
  ROOM_TYPE_CHILDRENS_ROOM,
  ROOM_TYPE_CORRIDOR,
  MAX_ROOM_TYPES_TO_IMPORT,
} = require('../../app/constants')
const {
  exceptions: { IMPORT_ESTATE_INVALID_SHEET },
} = use('App/exceptions')
const reader = new EstateImportReader(path.resolve('./test/unit/files/test.xlsx'))

before(async () => {})

test(`EstateImportReader returns error when a wrong file is uploaded`, async ({ assert }) => {
  try {
    const wrongExcelReader = new EstateImportReader(path.resolve('./test/unit/files/wrong.txt'))
  } catch (err) {
    assert.equal(err.message, IMPORT_ESTATE_INVALID_SHEET)
  }
})

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

test(`EstateImportReader.setValidColumns returns array of objects of valid columns`, async ({
  assert,
}) => {
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

test(`EstateImportReader.setValidColumns returns array of objects containing the correct index`, async ({
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

test(`EstateImportReader.processRow updates deposit attribute to be a product of net_rent and deposit attributes`, async ({
  assert,
}) => {
  const testRows = [
    { deposit: 3, net_rent: 1000 },
    { deposit: 0, net_rent: 1000 },
    { net_rent: 1000 },
    {},
  ]
  const expected = [{ deposit: 3000 }, { deposit: 0 }, { deposit: 0 }, { deposit: 0 }]
  testRows.map(async (row, index) => {
    row = await reader.processRow(row, 1, false)
    assert.deepInclude(row, expected[index])
  })
})

test(`EstateImportReader.processRow generates address from street, house number, zip, city and country`, async ({
  assert,
}) => {
  const testRows = [
    { street: 'Meinekestraße', house_number: 40, zip: 49453, city: 'Hemsloh', country: 'Germany' },
    { street: 'Meinekestraße', zip: 49453, city: 'Hemsloh', country: 'Germany' },
    { street: 'Meinekestraße', zip: 49453, city: 'Hemsloh' },
    {},
  ]
  const expected = [
    { address: 'meinekestraße 40, 49453 hemsloh, germany' },
    { address: 'meinekestraße, 49453 hemsloh, germany' },
    { address: 'meinekestraße, 49453 hemsloh' },
    { address: '' },
  ]
  testRows.map(async (row, index) => {
    row = await reader.processRow(row, 1, false)
    assert.deepInclude(row, expected[index])
  })
})

test(`EstateImportReader.processRow adds letting_status and letting_type from letting`, async ({
  assert,
}) => {
  const testRows = [
    { letting: 'n.a.' },
    { letting: 'Let - Standard' },
    { letting: 'Let - Defected' },
    { letting: 'Let - Terminated' },
    { letting: 'Void - First-time use' },
    { letting: 'Void - Construction works' },
    { letting: 'Void - Structural vacancy' },
    { letting: 'Void - Vacancy' },
    {},
  ]
  const expected = [
    { letting_type: LETTING_TYPE_NA },
    { letting_type: LETTING_TYPE_LET, letting_status: LETTING_STATUS_NORMAL },
    { letting_type: LETTING_TYPE_LET, letting_status: LETTING_STATUS_DEFECTED },
    { letting_type: LETTING_TYPE_LET, letting_status: LETTING_STATUS_TERMINATED },
    { letting_type: LETTING_TYPE_VOID, letting_status: LETTING_STATUS_FIRST_TIME_USE },
    { letting_type: LETTING_TYPE_VOID, letting_status: LETTING_STATUS_CONSTRUCTION_WORKS },
    { letting_type: LETTING_TYPE_VOID, letting_status: LETTING_STATUS_STRUCTURAL_VACANCY },
    { letting_type: LETTING_TYPE_VOID, letting_status: LETTING_STATUS_VACANCY },
    {},
  ]
  testRows.map(async (row, index) => {
    row = await reader.processRow(row, 1, false)
    assert.deepInclude(row, expected[index])
  })
})

test(`EstateImportReader.processRow adds letting_status and letting_type from letting in de language`, async ({
  assert,
}) => {
  const testRows = [
    { letting: 'k.A.' },
    { letting: 'Vermietet - Standard' },
    { letting: 'Vermietet - mangelhaft' },
    { letting: 'Vermietet - gekündigt' },
    { letting: 'Leer - Erstbezug' },
    { letting: 'Leer - Bauarbeiten' },
    { letting: 'Leer - strukturell leer' },
    { letting: 'Leer - Leerstand' },
    {},
  ]
  const expected = [
    { letting_type: LETTING_TYPE_NA },
    { letting_type: LETTING_TYPE_LET, letting_status: LETTING_STATUS_NORMAL },
    { letting_type: LETTING_TYPE_LET, letting_status: LETTING_STATUS_DEFECTED },
    { letting_type: LETTING_TYPE_LET, letting_status: LETTING_STATUS_TERMINATED },
    { letting_type: LETTING_TYPE_VOID, letting_status: LETTING_STATUS_FIRST_TIME_USE },
    { letting_type: LETTING_TYPE_VOID, letting_status: LETTING_STATUS_CONSTRUCTION_WORKS },
    { letting_type: LETTING_TYPE_VOID, letting_status: LETTING_STATUS_STRUCTURAL_VACANCY },
    { letting_type: LETTING_TYPE_VOID, letting_status: LETTING_STATUS_VACANCY },
    {},
  ]
  testRows.map(async (row, index) => {
    row = await reader.processRow(row, 1, false)
    assert.deepInclude(row, expected[index])
  })
})

test(`EstateImportReader.processRow updates roomX_type to object containing type and name`, async ({
  assert,
}) => {
  const testRows = [
    { room1_type: 'living room' },
    { room1_type: 'Guest room' },
    { room1_type: 'Stairs' },
    { room1_type: 'bedroom' },
    { room1_type: 'kitchen' },
    { room1_type: 'bath' },
    { room1_type: "children's room" },
    { room1_type: 'Corridor' },
  ]
  const expected = [
    {
      room1_type: {
        type: ROOM_TYPE_LIVING_ROOM,
        name: 'apartment.amenities.room_type.living_room',
      },
    },
    {
      room1_type: {
        type: ROOM_TYPE_GUEST_ROOM,
        name: 'landlord.property.inside_view.rooms.guest_room',
      },
    },
    {
      room1_type: {
        type: ROOM_TYPE_STAIRS,
        name: 'landlord.property.inside_view.rooms.stairs',
      },
    },
    {
      room1_type: {
        type: ROOM_TYPE_BEDROOM,
        name: 'apartment.amenities.room_type.bedroom',
      },
    },
    {
      room1_type: {
        type: ROOM_TYPE_KITCHEN,
        name: 'apartment.amenities.room_type.kitchen',
      },
    },
    { room1_type: { type: ROOM_TYPE_BATH, name: 'apartment.amenities.room_type.bath' } },
    {
      room1_type: {
        type: ROOM_TYPE_CHILDRENS_ROOM,
        name: "apartment.amenities.room_type.children's_room",
      },
    },
    {
      room1_type: {
        type: ROOM_TYPE_CORRIDOR,
        name: 'landlord.property.inside_view.rooms.corridor',
      },
    },
  ]
  testRows.map(async (row, index) => {
    row = await reader.processRow(row, 1, false)
    assert.deepEqual(row[`room1_type`], expected[index].room1_type)
  })
})

test(`EstateImportReader.processRow processes up to ${MAX_ROOM_TYPES_TO_IMPORT} rooms only.`, async ({
  assert,
}) => {
  const roomTypes = [
    'living room',
    'Guest room',
    'Stairs',
    'bedroom',
    'kitchen',
    'bath',
    "children's room",
    'Corridor',
    'living room',
    'Guest room',
  ]
  for (let k = 1; k <= MAX_ROOM_TYPES_TO_IMPORT + 3; k++) {
    let testRow = { [`room${k}_type`]: roomTypes[k] }
    testRow = await reader.processRow(testRow, 1, false)
    if (k <= MAX_ROOM_TYPES_TO_IMPORT) {
      //just test for truthy...
      assert.isOk(testRow[`room${k}_type`].name)
    } else {
      assert.isNotOk(testRow[`room${k}_type`].name)
    }
  }
})

test(`EstateImportReader.processRow adds salutation_int based on salutation_txt`)
