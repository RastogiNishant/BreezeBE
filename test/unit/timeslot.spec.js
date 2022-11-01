const moment = require('moment')
const { ROLE_USER, ROLE_LANDLORD } = require('../../app/constants')

const Suite = use('Test/Suite')('User')
const { test } = Suite
const User = use('App/Models/User')
const Estate = use('App/Models/Estate')
const TimeSlot = use('App/Models/TimeSlot')
const TimeSlotService = use('App/Services/TimeSlotService')
const EstateService = use('App/Services/EstateService')

const { before, after } = Suite

let testProspect, testLandlord, testEstate, testSlot, testSlotTomorrow

const {
  test_slot_length,
  testUserEmail,
  dummyTimeSlotData,
  dummyTimeSlotDataTomorrow,
  dummyCrossingTimeSlotData,
  test_start_at,
  test_end_at,
  test_start_at_tomorrow,
  test_end_at_tomorrow,
  invalid_slot_length,
  test_invalid_range_start_at,
  test_invalid_range_end_at,
} = require('../constants/timeslot')

const {
  exceptions: { INVALID_TIME_RANGE, TIME_SLOT_CROSSING_EXISTING },
} = require('../../app/excepions')

before(async () => {
  try {
    testProspect = await User.query().where('email', testUserEmail).where('role', ROLE_USER).first()
    testLandlord = await User.query()
      .where('email', testUserEmail)
      .where('role', ROLE_LANDLORD)
      .first()
    testEstate = await EstateService.createEstate({
      userId: testLandlord.id,
      data: {
        property_id: 'TESTINGPROPERTYID',
      },
    })

    if (!testProspect || !testLandlord || !testEstate) {
      //TODO: throw error
    }
  } catch (e) {
    console.log(e)
  }
})

after(async () => {
  if (testEstate) {
    await TimeSlot.query().where('estate_id', testEstate.id).delete()
    await Estate.query().where('id', testEstate.id).delete()
  }
})

test('it should deny to pass with invalid time range', async ({ assert }) => {
  try {
    TimeSlotService.validateTimeRange({
      start_at: test_invalid_range_start_at,
      end_at: test_invalid_range_end_at,
      slot_length: invalid_slot_length,
    })
    assert.fail('Invalid time range time slot accepted. Should not be accepted')
  } catch (e) {
    assert.equal(e.message, INVALID_TIME_RANGE)
  }
})

test('it should allow to pass with null slot_length', async ({ assert }) => {
  try {
    const resp = TimeSlotService.validateTimeRange({
      start_at: test_start_at,
      end_at: test_end_at,
      slot_length: null,
    })
    assert.equal(resp, true)
  } catch (e) {
    assert.fail('validateTimeRange should not throw error')
  }
})

test('it should allow to pass with valid time range', async ({ assert }) => {
  try {
    const resp = TimeSlotService.validateTimeRange({
      start_at: test_start_at,
      end_at: test_end_at,
      slot_length: test_slot_length,
    })
    assert.equal(resp, true)
  } catch (e) {
    assert.fail('validateTimeRange should not throw error')
  }
})

test('it should create a timeslot successfully with slot length', async ({ assert }) => {
  try {
    testSlot = await TimeSlotService.createSlot(dummyTimeSlotData, testEstate)
    testSlot = testSlot.toJSON()
    assert.equal(testSlot.estate_id, testEstate.id)
    assert.equal(testSlot.start_at, test_start_at)
    assert.equal(testSlot.end_at, test_end_at)
    assert.equal(testSlot.slot_length, test_slot_length)
  } catch (e) {
    console.log(e)
    assert.fail('Failed to create time slot')
  }
})

test('it should create a timeslot successfully without slot length', async ({ assert }) => {
  try {
    testSlotTomorrow = await TimeSlotService.createSlot(dummyTimeSlotDataTomorrow, testEstate)
    testSlotTomorrow = testSlotTomorrow.toJSON()
    assert.equal(testSlotTomorrow.estate_id, testEstate.id)
    assert.equal(testSlotTomorrow.start_at, test_start_at_tomorrow)
    assert.equal(testSlotTomorrow.end_at, test_end_at_tomorrow)
    assert.equal(testSlotTomorrow.slot_length, null)
  } catch (e) {
    console.log(e)
    assert.fail('Failed to create time slot')
  }
})

test('it should fail to create a timeslot due to crossing', async ({ assert }) => {
  try {
    testSlot = await TimeSlotService.createSlot(dummyCrossingTimeSlotData, testEstate)
    testSlot = testSlot.toJSON()
    assert.fail('Crossing time slot accepted. Should not be accepted')
  } catch (e) {
    assert.equal(e.message, TIME_SLOT_CROSSING_EXISTING)
  }
})

test('it should return null time slots by owner in case of not existing slotId', async ({
  assert,
}) => {
  try {
    const slot = await TimeSlotService.getTimeSlotByOwner(testLandlord.id, -1)
    assert.equal(slot, null)
  } catch (e) {
    console.log(e)
    assert.fail('Failed to get time slot by owner')
  }
})

test('it should return null time slots by owner in case of not existing userId', async ({
  assert,
}) => {
  try {
    const slot = await TimeSlotService.getTimeSlotByOwner(-1, testSlot.id)
    assert.equal(slot, null)
  } catch (e) {
    console.log(e)
    assert.fail('Failed to get time slot by owner')
  }
})

test('it should fetch the time slot by owner successfully', async ({ assert }) => {
  try {
    let slot = await TimeSlotService.getTimeSlotByOwner(testLandlord.id, testSlot.id)
    slot = slot.toJSON()
    assert.equal(slot.id, testSlot.id)
    assert.equal(slot.estate_id, testSlot.estate_id)
    assert.equal(moment(slot.start_at).format('X'), moment(testSlot.start_at).format('X'))
    assert.equal(moment(slot.end_at).format('X'), moment(testSlot.end_at).format('X'))
    assert.equal(slot.slot_length, testSlot.slot_length)
  } catch (e) {
    console.log(e)
    assert.fail('Failed to get time slot by owner')
  }
})

test('it should return null time slots by estate in case of null estate', async ({ assert }) => {
  try {
    const slots = await TimeSlotService.getTimeSlotsByEstate(null)
    assert.equal(slots, null)
  } catch (e) {
    console.log(e)
    assert.fail('Failed to get time slot by owner')
  }
})

test('it should return empty array in case of not existing estate', async ({ assert }) => {
  try {
    let slots = await TimeSlotService.getTimeSlotsByEstate({ id: -1 })
    slots = slots.toJSON()
    assert.equal(slots.length, 0)
  } catch (e) {
    console.log(e)
    assert.fail('Failed to get time slot by owner')
  }
})

test('it should fetch the time slots by estate successfully', async ({ assert }) => {
  try {
    let slots = await TimeSlotService.getTimeSlotsByEstate(testEstate)
    slots = slots.toJSON()
    assert.equal(slots.length, 2)

    assert.equal(slots[0].id, testSlotTomorrow.id)
    assert.equal(
      moment(slots[0].start_at).format('X'),
      moment(testSlotTomorrow.start_at).format('X')
    )
    assert.equal(moment(slots[0].end_at).format('X'), moment(testSlotTomorrow.end_at).format('X'))
    assert.equal(slots[0].estate_id, testSlotTomorrow.estate_id)
    assert.equal(slots[0].slot_length, testSlotTomorrow.slot_length)

    assert.equal(slots[1].id, testSlot.id)
    assert.equal(moment(slots[1].start_at).format('X'), moment(testSlot.start_at).format('X'))
    assert.equal(moment(slots[1].end_at).format('X'), moment(testSlot.end_at).format('X'))
    assert.equal(slots[1].estate_id, testSlot.estate_id)
    assert.equal(slots[1].slot_length, testSlot.slot_length)
  } catch (e) {
    console.log(e)
    assert.fail('Failed to get time slot by owner')
  }
})

test('it should return correct free slot items for existing time slots', async ({ assert }) => {
  try {
    const slots = await TimeSlotService.getFreeTimeslots(testEstate.id)

    assert.equal(Object.keys(slots).length, 2)

    const firstDayKey = Object.keys(slots)[0]
    assert.equal(firstDayKey, moment.utc(testSlot.start_at).startOf('day').format('X'))

    const secondDayKey = Object.keys(slots)[1]
    assert.equal(secondDayKey, moment.utc(testSlotTomorrow.start_at).startOf('day').format('X'))

    const firstDayItems = slots[firstDayKey]
    assert.equal(firstDayItems.length, 2)

    const firstDayFirstItem = {
      from: moment.utc(testSlot.start_at).format('X'),
      to: moment.utc(testSlot.start_at).add(test_slot_length, 'minutes').format('X'),
    }

    assert.equal(firstDayItems[0].from, parseInt(firstDayFirstItem.from))
    assert.equal(firstDayItems[0].to, parseInt(firstDayFirstItem.to))

    const firstDaySecondItem = {
      from: moment.utc(test_start_at).add(test_slot_length, 'minutes').format('X'),
      to: moment.utc(test_end_at).format('X'),
    }
    assert.equal(firstDayItems[1].from, parseInt(firstDaySecondItem.from))
    assert.equal(firstDayItems[1].to, parseInt(firstDaySecondItem.to))

    const secondDayItems = slots[secondDayKey]
    assert.equal(secondDayItems.length, 1)

    const secondDayFirstItem = {
      from: moment.utc(testSlotTomorrow.start_at).format('X'),
      to: moment.utc(testSlotTomorrow.end_at).format('X'),
    }

    assert.equal(secondDayItems[0].from, parseInt(secondDayFirstItem.from))
    assert.equal(secondDayItems[0].to, parseInt(secondDayFirstItem.to))
  } catch (e) {
    console.log(e)
    assert.fail('Failed to get free timeslots')
  }
})

// Check cases here: https://www.figma.com/file/4fPxivd1w6QbKJYmVfsobM/Landords?node-id=21068%3A1193
test('it should find the correct overlapping range according to case 1', async ({ assert }) => {
  const testCase = {
    prev_start_at: '2019-01-01 11:00:00',
    prev_end_at: '2019-01-01 15:00:00',

    start_at: '2019-01-01 10:00:00',
    end_at: '2019-01-01 16:00:00',
  }

  const ranges = TimeSlotService.getNotCrossRange(testCase)
  assert.equal(ranges.length, 0)
})

// Check cases here: https://www.figma.com/file/4fPxivd1w6QbKJYmVfsobM/Landords?node-id=21068%3A1193
test('it should find the correct overlapping range according to case 2', async ({ assert }) => {
  const testCase = {
    prev_start_at: '2019-01-01 11:00:00',
    prev_end_at: '2019-01-01 15:00:00',

    start_at: '2019-01-01 12:00:00',
    end_at: '2019-01-01 13:00:00',
  }

  const ranges = TimeSlotService.getNotCrossRange(testCase)
  assert.equal(ranges.length, 2)

  assert.equal(ranges[0].start_at, testCase.prev_start_at)
  assert.equal(ranges[0].end_at, testCase.start_at)

  assert.equal(ranges[1].start_at, testCase.end_at)
  assert.equal(ranges[1].end_at, testCase.prev_end_at)
})

// Check cases here: https://www.figma.com/file/4fPxivd1w6QbKJYmVfsobM/Landords?node-id=21068%3A1193
test('it should find only one crossing range regarding to case 3 - 1', async ({ assert }) => {
  const testCase = {
    prev_start_at: '2019-01-01 11:00:00',
    prev_end_at: '2019-01-01 15:00:00',

    start_at: '2019-01-01 10:00:00',
    end_at: '2019-01-01 13:00:00',
  }

  const ranges = TimeSlotService.getNotCrossRange(testCase)
  assert.equal(ranges.length, 1)

  assert.equal(ranges[0].start_at, testCase.end_at)
  assert.equal(ranges[0].end_at, testCase.prev_end_at)
})

// Check cases here: https://www.figma.com/file/4fPxivd1w6QbKJYmVfsobM/Landords?node-id=21068%3A1193
test('it should find the correct overlapping range according to case 3 - 2', async ({ assert }) => {
  const testCase = {
    prev_start_at: '2019-01-01 11:00:00',
    prev_end_at: '2019-01-01 15:00:00',

    start_at: '2019-01-01 11:00:00',
    end_at: '2019-01-01 13:00:00',
  }

  const ranges = TimeSlotService.getNotCrossRange(testCase)
  assert.equal(ranges.length, 1)

  assert.equal(ranges[0].start_at, testCase.end_at)
  assert.equal(ranges[0].end_at, testCase.prev_end_at)
})

// Check cases here: https://www.figma.com/file/4fPxivd1w6QbKJYmVfsobM/Landords?node-id=21068%3A1193
test('it should find the correct overlapping range according to case 4 - 1', async ({ assert }) => {
  const testCase = {
    prev_start_at: '2019-01-01 11:00:00',
    prev_end_at: '2019-01-01 15:00:00',

    start_at: '2019-01-01 13:00:00',
    end_at: '2019-01-01 16:00:00',
  }

  const ranges = TimeSlotService.getNotCrossRange(testCase)
  assert.equal(ranges.length, 1)

  assert.equal(ranges[0].start_at, testCase.prev_start_at)
  assert.equal(ranges[0].end_at, testCase.start_at)
})

// Check cases here: https://www.figma.com/file/4fPxivd1w6QbKJYmVfsobM/Landords?node-id=21068%3A1193
test('it should find the correct overlapping range according to case 4 - 2', async ({ assert }) => {
  const testCase = {
    prev_start_at: '2019-01-01 11:00:00',
    prev_end_at: '2019-01-01 15:00:00',

    start_at: '2019-01-01 13:00:00',
    end_at: '2019-01-01 15:00:00',
  }

  const ranges = TimeSlotService.getNotCrossRange(testCase)
  assert.equal(ranges.length, 1)

  assert.equal(ranges[0].start_at, testCase.prev_start_at)
  assert.equal(ranges[0].end_at, testCase.start_at)
})

// Check cases here: https://www.figma.com/file/4fPxivd1w6QbKJYmVfsobM/Landords?node-id=21068%3A1193
test('it should find the correct overlapping range according to case 5 - 1', async ({ assert }) => {
  const testCase = {
    prev_start_at: '2019-01-01 11:00:00',
    prev_end_at: '2019-01-01 15:00:00',

    start_at: '2019-01-01 08:00:00',
    end_at: '2019-01-01 10:00:00',
  }

  const ranges = TimeSlotService.getNotCrossRange(testCase)
  assert.equal(ranges.length, 1)

  assert.equal(ranges[0].start_at, testCase.prev_start_at)
  assert.equal(ranges[0].end_at, testCase.prev_end_at)
})

// Check cases here: https://www.figma.com/file/4fPxivd1w6QbKJYmVfsobM/Landords?node-id=21068%3A1193
test('it should find the correct overlapping range according to case 5 - 2', async ({ assert }) => {
  const testCase = {
    prev_start_at: '2019-01-01 11:00:00',
    prev_end_at: '2019-01-01 15:00:00',

    start_at: '2019-01-01 08:00:00',
    end_at: '2019-01-01 11:00:00',
  }

  const ranges = TimeSlotService.getNotCrossRange(testCase)
  assert.equal(ranges.length, 1)

  assert.equal(ranges[0].start_at, testCase.prev_start_at)
  assert.equal(ranges[0].end_at, testCase.prev_end_at)
})

// Check cases here: https://www.figma.com/file/4fPxivd1w6QbKJYmVfsobM/Landords?node-id=21068%3A1193
test('it should find the correct overlapping range according to case 6 - 1', async ({ assert }) => {
  const testCase = {
    prev_start_at: '2019-01-01 11:00:00',
    prev_end_at: '2019-01-01 15:00:00',

    start_at: '2019-01-01 16:00:00',
    end_at: '2019-01-01 20:00:00',
  }

  const ranges = TimeSlotService.getNotCrossRange(testCase)
  assert.equal(ranges.length, 1)

  assert.equal(ranges[0].start_at, testCase.prev_start_at)
  assert.equal(ranges[0].end_at, testCase.prev_end_at)
})

// Check cases here: https://www.figma.com/file/4fPxivd1w6QbKJYmVfsobM/Landords?node-id=21068%3A1193
test('it should find the correct overlapping range according to case 6 - 2', async ({ assert }) => {
  const testCase = {
    prev_start_at: '2019-01-01 11:00:00',
    prev_end_at: '2019-01-01 15:00:00',

    start_at: '2019-01-01 15:00:00',
    end_at: '2019-01-01 20:00:00',
  }

  const ranges = TimeSlotService.getNotCrossRange(testCase)
  assert.equal(ranges.length, 1)

  assert.equal(ranges[0].start_at, testCase.prev_start_at)
  assert.equal(ranges[0].end_at, testCase.prev_end_at)
})

// Check cases here: https://www.figma.com/file/4fPxivd1w6QbKJYmVfsobM/Landords?node-id=21068%3A1193
test('it should find the correct overlapping range according to case 7', async ({ assert }) => {
  const testCase = {
    prev_start_at: '2019-01-01 11:00:00',
    prev_end_at: '2019-01-01 15:00:00',

    start_at: '2019-01-01 11:00:00',
    end_at: '2019-01-01 15:00:00',
  }

  const ranges = TimeSlotService.getNotCrossRange(testCase)
  assert.equal(ranges.length, 0)
})

//TODO: add tests for removeSlot method
