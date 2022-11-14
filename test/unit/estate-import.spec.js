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
  SALUTATION_MR,
  SALUTATION_MS,
  SALUTATION_NOT_DEFINED,
  PROPERTY_TYPE_APARTMENT,
  PROPERTY_TYPE_ROOM,
  PROPERTY_TYPE_HOUSE,
  PROPERTY_TYPE_SITE,
  USE_TYPE_RESIDENTIAL,
  USE_TYPE_COMMERCIAL,
  USE_TYPE_PLANT,
  USE_TYPE_OTHER,
  HOUSE_TYPE_MULTIFAMILY_HOUSE,
  HOUSE_TYPE_HIGH_RISE,
  HOUSE_TYPE_SERIES,
  HOUSE_TYPE_SEMIDETACHED_HOUSE,
  HOUSE_TYPE_2FAMILY_HOUSE,
  HOUSE_TYPE_DETACHED_HOUSE,
  HOUSE_TYPE_COUNTRY,
  HOUSE_TYPE_BUNGALOW,
  HOUSE_TYPE_VILLA,
  HOUSE_TYPE_GARDENHOUSE,
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
} = require('../../app/constants')
const {
  exceptions: { IMPORT_ESTATE_INVALID_SHEET },
  exceptionKeys: { IMPORT_ESTATE_INVALID_VARIABLE_WARNING },
  getExceptionMessage,
} = use('App/exceptions')
const reader = new EstateImportReader(path.resolve('./test/unit/files/test.xlsx'))
const l = use('Localize')

before(async () => {})

test(`EstateImportReader returns error when a wrong file is uploaded`, async ({ assert }) => {
  try {
    //should have been in a functional test but it could be loaded in a unit test
    const wrongExcelLoadedReader = new EstateImportReader(
      path.resolve('./test/unit/files/wrong.txt')
    )
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

test(`EstateImportReader appends to warnings for invalid columns`, async ({ assert }) => {
  const invalidColumns = ['not_a_valid_column', 'another_invalid_column']
  reader.warnings.map((warning, index) => {
    assert.equal(
      warning,
      getExceptionMessage('', IMPORT_ESTATE_INVALID_VARIABLE_WARNING, invalidColumns[index])
    )
  })
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

test(`EstateImportReader.processRow adds salutation_int based on salutation_txt`, async ({
  assert,
}) => {
  const salutations = ['Mr.', 'Ms.', 'Not Defined', 'Herr', 'Frau', 'Nicht definiert', '']
  const expected = [
    SALUTATION_MR,
    SALUTATION_MS,
    SALUTATION_NOT_DEFINED,
    SALUTATION_MR,
    SALUTATION_MS,
    SALUTATION_NOT_DEFINED,
    undefined,
  ]
  salutations.map(async (salutation, index) => {
    let result = await reader.processRow({ txt_salutation: salutation }, 1, false)
    assert.equal(result.salutation_int, expected[index])
  })
})

//map value:
test(`EstateImportReader.mapValue maps result to expected values for property_type`, async ({
  assert,
}) => {
  const types = ['Apartment', 'Room', 'House', 'Site']
  const langs = ['en', 'de']
  const expected = [
    PROPERTY_TYPE_APARTMENT,
    PROPERTY_TYPE_ROOM,
    PROPERTY_TYPE_HOUSE,
    PROPERTY_TYPE_SITE,
  ]
  types.map((type, type_index) => {
    langs.map((lang) => {
      let result = reader.mapValue(
        'property_type',
        l.get(`property.attribute.PROPERTY_TYPE.${type}.message`, lang)
      )
      assert.equal(result, expected[type_index])
    })
  })
})

test(`EstateImportReader.mapValue maps result to expected values for use_type`, async ({
  assert,
}) => {
  const types = ['Residential', 'Commercial', 'Plant', 'Other']

  const langs = ['en', 'de']
  const expected = [USE_TYPE_RESIDENTIAL, USE_TYPE_COMMERCIAL, USE_TYPE_PLANT, USE_TYPE_OTHER]
  types.map((type, type_index) => {
    langs.map((lang) => {
      let result = reader.mapValue(
        'use_type',
        l.get(`property.attribute.USE_TYPE.${type}.message`, lang)
      )
      assert.equal(result, expected[type_index])
    })
  })
})

test(`EstateImportReader.mapValue maps result to expected values for house_type`, async ({
  assert,
}) => {
  const types = [
    'Multi-family_house',
    'High_rise',
    'Series',
    'Semidetached_house',
    'Two_family_house',
    'Detached_house',
    'Country',
    'Bungalow',
    'Villa',
    'Gardenhouse',
  ]
  const langs = ['en', 'de']
  const expected = [
    HOUSE_TYPE_MULTIFAMILY_HOUSE,
    HOUSE_TYPE_HIGH_RISE,
    HOUSE_TYPE_SERIES,
    HOUSE_TYPE_SEMIDETACHED_HOUSE,
    HOUSE_TYPE_2FAMILY_HOUSE,
    HOUSE_TYPE_DETACHED_HOUSE,
    HOUSE_TYPE_COUNTRY,
    HOUSE_TYPE_BUNGALOW,
    HOUSE_TYPE_VILLA,
    HOUSE_TYPE_GARDENHOUSE,
  ]
  types.map((type, type_index) => {
    langs.map((lang) => {
      let result = reader.mapValue(
        'house_type',
        l.get(`property.attribute.HOUSE_TYPE.${type}.message`, lang)
      )
      assert.equal(result, expected[type_index])
    })
  })
})

test(`EstateImportReader.mapValue maps result to expected values for building_status`, async ({
  assert,
}) => {
  const types = [
    'First_time_occupied',
    'Part_complete_renovation_need',
    'New',
    'Existing',
    'Part_fully_renovated',
    'Partly_refurished',
    'In_need_of_renovation',
    'Ready_to_be_built',
    'By_agreement',
    'Modernized',
    'Cleaned',
    'Rough_building',
    'Developed',
    'Abrissobjekt',
    'Projected',
  ]

  const langs = ['en', 'de']
  const expected = [
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
  ]
  types.map((type, type_index) => {
    langs.map((lang) => {
      let result = reader.mapValue(
        'building_status',
        l.get(`property.attribute.BUILDING_STATUS.${type}.message`, lang)
      )
      console.log(result, type, expected[type_index])
      assert.equal(result, expected[type_index])
    })
  })
})
