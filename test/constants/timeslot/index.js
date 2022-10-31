const moment = require('moment')
const Database = use('Database')
const { MATCH_STATUS_VISIT, DATE_FORMAT } = require('../../../app/constants')
const Visit = use('App/Models/Visit')
const Match = use('App/Models/Match')

const getTomorrow = () => moment.utc().startOf('day').add(1, 'day')
const test_start_at = getTomorrow().add(6, 'hours').format(DATE_FORMAT)
const test_end_at = getTomorrow().add(7, 'hours').format(DATE_FORMAT)
const test_slot_length = 30

const test_new_start_at = getTomorrow().add(6, 'hours').format(DATE_FORMAT)
const test_new_end_at = getTomorrow().add(6, 'hours').add(30, 'minutes').format(DATE_FORMAT)
const test_new_slot_length = 5

const invalid_slot_length = 12

const test_start_at_tomorrow = getTomorrow().add(1, 'day').add(6, 'hours').format(DATE_FORMAT)
const test_end_at_tomorrow = getTomorrow().add(1, 'day').add(7, 'hours').format(DATE_FORMAT)

const test_crossing_start_at = getTomorrow().add(6, 'hours').format(DATE_FORMAT)
const test_crossing_end_at = getTomorrow().add(6, 'hours').add(30, 'minutes').format(DATE_FORMAT)

const test_invalid_range_start_at = getTomorrow().format(DATE_FORMAT)
const test_invalid_range_end_at = getTomorrow().add(32, 'minutes').format(DATE_FORMAT)

const testUserEmail = 'it@bits.ventures'
const testUserEmail2 = 'ookndkrk@gmail.com'

const dummyTimeSlotData = {
  start_at: test_start_at,
  end_at: test_end_at,
  slot_length: test_slot_length,
}

const dummyTimeSlotDataTomorrow = {
  start_at: test_start_at_tomorrow,
  end_at: test_end_at_tomorrow,
}

const dummyCrossingTimeSlotData = {
  start_at: test_crossing_start_at,
  end_at: test_crossing_end_at,
  slot_length: test_slot_length,
}

const dummyInvalidRangeTimeSlotData = {
  start_at: test_invalid_range_start_at,
  end_at: test_invalid_range_end_at,
  slot_length: test_slot_length,
}

const prepareVisitMatch = (prospect, estate) => {
  return {
    estate_id: estate.id,
    user_id: prospect.id,
    status: MATCH_STATUS_VISIT,
    percent: 100,
  }
}

const prepareVisitInTimeRange = (prospect, estate) => {
  return {
    estate_id: estate.id,
    user_id: prospect.id,
    date: moment.utc(dummyTimeSlotData.start_at).format(DATE_FORMAT),
    start_date: moment.utc(dummyTimeSlotData.start_at).format(DATE_FORMAT),
    end_date: moment.utc(dummyTimeSlotData.start_at).add(30, 'minutes').format(DATE_FORMAT),
  }
}

const prepareVisitOutOfTimeRange = (prospect, estate) => {
  return {
    estate_id: estate.id,
    user_id: prospect.id,
    date: dummyTimeSlotData.start_at,
    start_date: test_new_end_at,
    end_date: dummyTimeSlotData.end_at,
  }
}

const prepareTimeSlotUpdationDependencies = async ({ firstProspect, secondProspect, estate }) => {
  // Prepare records
  let matchInTimeRange = prepareVisitMatch(firstProspect, estate)
  let matchOutOfTimeRange = prepareVisitMatch(secondProspect, estate)
  let visitInTimeRange = prepareVisitInTimeRange(firstProspect, estate)
  let visitOutOfTimeRange = prepareVisitOutOfTimeRange(secondProspect, estate)

  // Insert records
  await Promise.all([
    Database.table('matches').insert(matchInTimeRange),
    Database.table('matches').insert(matchOutOfTimeRange),
    Database.table('visits').insert(visitInTimeRange),
    Database.table('visits').insert(visitOutOfTimeRange),
  ])
}

const findTimeSlotUpdationDependencies = async ({ firstProspect, secondProspect, estate }) => {
  const [matchInTimeRange, matchOutOfTimeRange, visitInTimeRange, visitOutOfTimeRange] =
    await Promise.all([
      await Match.query().where({ estate_id: estate.id, user_id: firstProspect.id }).first(),
      await Match.query().where({ estate_id: estate.id, user_id: secondProspect.id }).first(),
      await Visit.query().where({ estate_id: estate.id, user_id: firstProspect.id }).first(),
      await Visit.query().where({ estate_id: estate.id, user_id: secondProspect.id }).first(),
    ])
  return { matchInTimeRange, matchOutOfTimeRange, visitInTimeRange, visitOutOfTimeRange }
}

module.exports = {
  getTomorrow,
  test_start_at,
  test_end_at,
  test_slot_length,
  test_new_start_at,
  test_new_end_at,
  test_new_slot_length,
  invalid_slot_length,
  test_start_at_tomorrow,
  test_end_at_tomorrow,
  test_crossing_start_at,
  test_crossing_end_at,
  test_invalid_range_start_at,
  test_invalid_range_end_at,
  testUserEmail,
  testUserEmail2,
  dummyTimeSlotData,
  dummyTimeSlotDataTomorrow,
  dummyCrossingTimeSlotData,
  dummyInvalidRangeTimeSlotData,
  prepareVisitMatch,
  prepareVisitInTimeRange,
  prepareVisitOutOfTimeRange,
  prepareTimeSlotUpdationDependencies,
  findTimeSlotUpdationDependencies,
}
