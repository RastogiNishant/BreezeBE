const {
  ROLE_USER,
  ROLE_LANDLORD,
  MATCH_STATUS_VISIT,
  MATCH_STATUS_INVITE,
} = require('../../app/constants')
const {
  test_new_start_at,
  test_new_end_at,
  testUserEmail,
  testUserEmail2,
  dummyTimeSlotData,
  dummyTimeSlotDataTomorrow,
  dummyCrossingTimeSlotData,
  dummyInvalidRangeTimeSlotData,
  prepareTimeSlotUpdationDependencies,
  findTimeSlotUpdationDependencies,
  test_new_slot_length,
  test_start_at,
  test_end_at,
} = require('../constants/timeslot')

const Suite = use('Test/Suite')('Time Slot Functional')
const { test, before, after, trait, beforeEach } = Suite
const User = use('App/Models/User')
const Estate = use('App/Models/Estate')
const TimeSlot = use('App/Models/TimeSlot')
const Visit = use('App/Models/Visit')
const Match = use('App/Models/Match')
const TimeSlotService = use('App/Services/TimeSlotService')
const EstateService = use('App/Services/EstateService')

trait('Test/ApiClient')
trait('Auth/Client')

let testProspect, testLandlord, testProspectAnother, testEstate, testSlot

before(async () => {
  try {
    testProspect = await User.query().where('email', testUserEmail).where('role', ROLE_USER).first()
    testProspectAnother = await User.query()
      .where('email', testUserEmail2)
      .where('role', ROLE_USER)
      .first()
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

beforeEach(async () => {
  if (testEstate) {
    await Match.query().where('estate_id', testEstate.id).delete()
    await Visit.query().where('estate_id', testEstate.id).delete()
  }
})

test('create timeslot successfully with slot length', async ({ assert, client }) => {
  try {
    let response = await client
      .post(`/api/v1/estates/${testEstate.id}/slots`)
      .loginVia(testLandlord, 'jwtLandlord')
      .send(dummyTimeSlotData)
      .end()

    testSlot = response.body.data

    response.assertStatus(200)
    response.assertJSONSubset({
      data: {
        estate_id: testEstate.id,
        ...dummyTimeSlotData,
      },
    })
  } catch (e) {
    console.log(e)
    assert.fail('Failed to create time slot')
  }
})

test('create timeslot successfully without slot length', async ({ assert, client }) => {
  try {
    let response = await client
      .post(`/api/v1/estates/${testEstate.id}/slots`)
      .loginVia(testLandlord, 'jwtLandlord')
      .send(dummyTimeSlotDataTomorrow)
      .end()
    response.assertStatus(200)
    response.assertJSONSubset({
      data: {
        estate_id: testEstate.id,
        ...dummyTimeSlotDataTomorrow,
      },
    })
  } catch (e) {
    assert.fail('Failed to create time slot')
  }
})

test('create timeslot failure due to crossing', async ({ assert, client }) => {
  try {
    let response = await client
      .post(`/api/v1/estates/${testEstate.id}/slots`)
      .loginVia(testLandlord, 'jwtLandlord')
      .send(dummyCrossingTimeSlotData)
      .end()
    response.assertStatus(400)
    response.assertError({
      status: 'error',
      data: 'Time slot crossing existing',
      code: 0,
    })
  } catch (e) {
    assert.fail('Crossing time slot test failed.')
  }
})

test('create timeslot failure due to invalid time range', async ({ assert, client }) => {
  try {
    let response = await client
      .post(`/api/v1/estates/${testEstate.id}/slots`)
      .loginVia(testLandlord, 'jwtLandlord')
      .send(dummyInvalidRangeTimeSlotData)
      .end()
    response.assertStatus(400)
    response.assertError({
      status: 'error',
      data: 'Invalid time range',
      code: 0,
    })
  } catch (e) {
    console.log(e)
    assert.fail('Time slot invalid time range test failed.')
  }
})

test('create timeslot failure due to invalid time range', async ({ assert, client }) => {
  try {
    let response = await client
      .post(`/api/v1/estates/${testEstate.id}/slots`)
      .loginVia(testLandlord, 'jwtLandlord')
      .send(dummyInvalidRangeTimeSlotData)
      .end()
    response.assertStatus(400)
    response.assertError({
      status: 'error',
      data: 'Invalid time range',
      code: 0,
    })
  } catch (e) {
    console.log(e)
    assert.fail('Time slot invalid time range test failed.')
  }
})

test('create timeslot failure due to empty start_at', async ({ assert, client }) => {
  try {
    let response = await client
      .post(`/api/v1/estates/${testEstate.id}/slots`)
      .loginVia(testLandlord, 'jwtLandlord')
      .send({ ...dummyInvalidRangeTimeSlotData, start_at: '' })
      .end()

    console.log({ resp: response.body.data })

    // response.assertStatus(400)
    // response.assertError({
    //   status: 'error',
    //   data: 'Invalid time range',
    //   code: 0,
    // })
  } catch (e) {
    console.log(e)
    assert.fail('Time slot invalid time range test failed.')
  }
})

//TODO: empty start_at
//TODO: empty end_at
//TODO: end_at before start_at
//TODO: invalid slot_length
//TODO: not existing estate_id
//TODO: deleted estate_id

// Update time slot has multiple dependecies
// Out of range visits will be deleted
// Out of range visit matches should be invite match

test('update time slot and handle dependencies successfully', async ({ assert, client }) => {
  // old time slot between 06:00 - 07:00
  // new time slot between 06:00 - 06:30

  try {
    await prepareTimeSlotUpdationDependencies({
      firstProspect: testProspect,
      secondProspect: testProspectAnother,
      estate: testEstate,
    })

    let response = await client
      .put(`/api/v1/estates/${testEstate.id}/slots/${testSlot.id}`)
      .loginVia(testLandlord, 'jwtLandlord')
      .send({ start_at: test_new_start_at, end_at: test_new_end_at })
      .end()

    response.assertStatus(200)
    response.assertJSONSubset({
      data: {
        ...testSlot,
        start_at: test_new_start_at,
        end_at: test_new_end_at,
        prev_start_at: test_start_at,
        prev_end_at: test_end_at,
      },
    })

    testSlot = response.body.data

    const dependencies = await findTimeSlotUpdationDependencies({
      firstProspect: testProspect,
      secondProspect: testProspectAnother,
      estate: testEstate,
    })

    assert.equal(dependencies.matchOutOfTimeRange.status, MATCH_STATUS_INVITE)
    assert.equal(dependencies.matchInTimeRange.status, MATCH_STATUS_VISIT)
    assert.exists(dependencies.visitInTimeRange)
    assert.isNull(dependencies.visitOutOfTimeRange)
  } catch (e) {
    console.log(e)
    assert.fail('Unexpected error in time slot update')
  }
})

// All visits should be deleted
// All visit matches should be converted to invite match
test('update time slot slot_length and handle dependencies successfully', async ({
  assert,
  client,
}) => {
  try {
    await prepareTimeSlotUpdationDependencies({
      firstProspect: testProspect,
      secondProspect: testProspectAnother,
      estate: testEstate,
    })

    let response = await client
      .put(`/api/v1/estates/${testEstate.id}/slots/${testSlot.id}`)
      .loginVia(testLandlord, 'jwtLandlord')
      .send({
        start_at: test_new_start_at,
        end_at: test_new_end_at,
        slot_length: test_new_slot_length,
      })
      .end()

    response.assertStatus(200)
    response.assertJSONSubset({
      data: {
        start_at: test_new_start_at,
        end_at: test_new_end_at,
        prev_start_at: test_new_start_at,
        prev_end_at: test_new_end_at,
        slot_length: test_new_slot_length,
      },
    })

    testSlot = response.body.data

    const dependencies = await findTimeSlotUpdationDependencies({
      firstProspect: testProspect,
      secondProspect: testProspectAnother,
      estate: testEstate,
    })

    assert.equal(dependencies.matchInTimeRange.status, MATCH_STATUS_INVITE)
    assert.isNull(dependencies.visitInTimeRange)
  } catch (e) {
    console.log(e)
    assert.fail('Unexpected error in time slot update')
  }
})
