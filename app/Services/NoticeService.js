'use strict'

const { isEmpty, chunk } = require('lodash')
const moment = require('moment')
const P = require('bluebird')
const Logger = use('Logger')
const Database = use('Database')
const UserService = use('App/Services/UserService')
const Notice = use('App/Models/Notice')
const EstateService = use('App/Services/EstateService')
const VisitService = use('App/Services/VisitService')
const NotificationsService = use('App/Services/NotificationsService')

const MIN_TIME_SLOT = 5

const {
  ROLE_USER,
  DATE_FORMAT,
  NOTICE_TYPE_LANDLORD_QUESTION_ID,
  NOTICE_TYPE_LANDLORD_FILL_PROFILE_ID,
  NOTICE_TYPE_LANDLORD_NEW_PROPERTY_ID,
  NOTICE_TYPE_LANDLORD_TIME_FINISHED_ID,
  NOTICE_TYPE_LANDLORD_CONFIRM_VISIT_ID,
  NOTICE_TYPE_LANDLORD_RECONFIRMED_ID,
  NOTICE_TYPE_LANDLORD_VISIT_STARTING_ID,
  NOTICE_TYPE_LANDLORD_MATCH_ID,
  NOTICE_TYPE_LANDLORD_DECISION_ID,
  NOTICE_TYPE_PROSPECT_QUESTION_ID,
  NOTICE_TYPE_PROSPECT_MENTION_ID,
  NOTICE_TYPE_PROSPECT_NEW_MATCH_ID,
  NOTICE_TYPE_PROSPECT_MATCH_LEFT_ID,
  NOTICE_TYPE_PROSPECT_INVITE_ID,
  NOTICE_TYPE_PROSPECT_VISIT3H_ID,
  NOTICE_TYPE_PROSPECT_VISIT90M_ID,
  NOTICE_TYPE_LANDLORD_VISIT90M_ID,
  NOTICE_TYPE_PROSPECT_VISIT30M_ID,
  NOTICE_TYPE_PROSPECT_COMMIT_ID,
  NOTICE_TYPE_PROSPECT_REJECT_ID,
  NOTICE_TYPE_CONFIRM_QUESTION_ID,
  NOTICE_TYPE_PROSPECT_NO_ACTIVITY_ID,
  NOTICE_TYPE_PROSPECT_PROFILE_EXPIRE_ID,
  MATCH_STATUS_COMMIT,
  MATCH_STATUS_TOP,
  MATCH_STATUS_NEW,
  STATUS_ACTIVE,
} = require('../constants')

class NoticeService {
  /**
   * Insert multiple notices
   */
  static async insertNotices(data) {
    return Database.from('notices').insert(
      data.map((i) => ({
        ...i,
        created_at: Database.fn.now(),
        updated_at: Database.fn.now(),
      }))
    )
  }

  /**
   * If landlord inactive for a day
   */
  static async sendLandlordNewProperty() {
    const newLandlords = await UserService.getNewestInactiveLandlordsIds()
    if (isEmpty(newLandlords)) {
      return false
    }

    // Save notices to DB

    const notices = newLandlords.map(({ id }) => ({
      user_id: id,
      type: NOTICE_TYPE_LANDLORD_FILL_PROFILE_ID,
    }))
    await NoticeService.insertNotices(notices)
    await NotificationsService.sendLandlordNoProperty(notices)
  }

  /**
   * If landlord inactive for a 7 days
   */
  static async sandLandlord7DaysInactive() {
    const inactiveLandlords = await UserService.get7DaysInactiveLandlord()
    if (isEmpty(inactiveLandlords)) {
      return false
    }

    const notices = inactiveLandlords.map(({ id }) => ({
      user_id: id,
      type: NOTICE_TYPE_LANDLORD_NEW_PROPERTY_ID,
    }))
    await NoticeService.insertNotices(notices)
    await NotificationsService.sendLandlordNewProperty(notices)
  }

  /**
   * If prospect register 2 days ago and has no activity
   */
  static async sandProspectNoActivity() {
    const dateTo = moment.utc().startOf('day').add(-2, 'days')
    const dateFrom = dateTo.clone().add().add(-1, 'days')
    // WITH users register 2 days ago
    const queryWith = Database.table({ _u: 'users' })
      .select('_u.id')
      .where('_u.role', ROLE_USER)
      .where('_u.created_at', '>=', dateFrom.format(DATE_FORMAT))
      .where('_u.created_at', '<', dateTo.format(DATE_FORMAT))

    // Users has matches
    const q1 = Database.table({ _u: 'require_users' })
      .select('_u.id', Database.raw('COUNT(_m.user_id) as cnt'))
      .leftJoin({ _m: 'matches' }, '_m.user_id', '_u.id')
      .groupBy('_u.id')

    // Users has likes
    const q2 = Database.table({ _u: 'require_users' })
      .select('_u.id', Database.raw('COUNT(_l.user_id) as cnt'))
      .leftJoin({ _l: 'likes' }, '_l.user_id', '_u.id')
      .groupBy('_u.id')

    // Main request
    const res = await Database.from(
      Database.raw(`${q1.toString()} UNION ${q2.toString()}`).wrap('(', ') AS _t')
    )
      .select('_t.id')
      .groupBy('_t.id')
      .with('require_users', queryWith)
      .havingRaw('SUM(_t.cnt) = ?', [0])

    const noActiveProspects = res.map((i) => i.id)
    if (isEmpty(noActiveProspects)) {
      return false
    }

    const notices = noActiveProspects.map((id) => ({
      user_id: id,
      type: NOTICE_TYPE_PROSPECT_NO_ACTIVITY_ID,
    }))

    await NoticeService.insertNotices(notices)
    await NotificationsService.sendProspectNoActivity(notices)
  }

  /**
   * On estate expiration, send to landlord
   */
  static async landLandlordEstateExpired(estateIds) {
    if (isEmpty(estateIds)) {
      return false
    }

    // Get just expired estate data
    const data = await Database.select('_e.address', '_e.id', '_e.user_id')
      .table({ _e: 'estates' })
      .whereIn('_e.id', estateIds)

    // Create new notice items
    const items = data.map(({ address, id, user_id }) => ({
      user_id,
      type: NOTICE_TYPE_LANDLORD_TIME_FINISHED_ID,
      data: { estate_id: id, estate_address: address },
    }))
    await NoticeService.insertNotices(items)
    await NotificationsService.sendEstateExpired(items)
  }

  /**
   *
   */
  static async landlordTimeslotsBooked(estateId, total = 0, booked = 0) {
    const estate = await Database.select('estates.*')
      .table('estates')
      .where('estates.id', estateId)
      .first()
    if (!estate) {
      return false
    }

    const data = {
      estate_id: estate.id,
      estate_address: estate.address,
      total,
      booked,
    }

    const notice = { user_id: estate.user_id, type: NOTICE_TYPE_LANDLORD_CONFIRM_VISIT_ID, data }
    await NoticeService.insertNotices([notice])
    await NotificationsService.sendLandlordSlotsSelected([notice])
  }

  /**
   *
   */
  static async estateFinalConfirm(estateId, userId) {
    const getCurrentEstate = () => {
      return Database.table('estates')
        .select('address', 'user_id', 'id')
        .where({ id: estateId })
        .first()
    }

    // Another landlord who got this user as commit
    const getAnotherEstates = () => {
      return Database.table({ _m: 'matches' })
        .select('_e.address', '_e.user_id', '_e.id')
        .innerJoin({ _e: 'estates' }, '_e.id', '_m.estate_id')
        .where({
          '_m.user_id': userId,
          '_m.status': MATCH_STATUS_COMMIT,
        })
        .whereNot('_e.id', estateId)
        .limit(100)
    }

    // Another top users from current estate
    const getAnotherUsersCurEstate = () => {
      return Database.table({ _m: 'matches' })
        .select('_m.user_id')
        .where({ '_m.estate_id': estateId })
        .where(function () {
          this.orWhere({ '_m.status': MATCH_STATUS_TOP }).orWhere({ '_m.share': true })
        })
        .whereNot('_m.user_id', userId)
        .limit(100)
    }

    const { estate, anotherEstates, anotherUsers } = await P.props({
      estate: getCurrentEstate(),
      anotherEstates: getAnotherEstates(),
      anotherUsers: getAnotherUsersCurEstate(),
    })

    // Build notices data
    const successNotice = {
      user_id: estate.user_id,
      type: NOTICE_TYPE_LANDLORD_MATCH_ID,
      data: { estate_id: estate.id, estate_address: estate.address },
    }

    const rejectNotices = anotherEstates.map(({ user_id, address, id }) => ({
      user_id,
      type: NOTICE_TYPE_LANDLORD_DECISION_ID,
      data: { estate_id: id, estate_address: address },
    }))

    const rejectedUsers = anotherUsers.map(({ user_id }) => ({
      user_id,
      type: NOTICE_TYPE_PROSPECT_REJECT_ID,
      data: { estate_id: estate.id, estate_address: estate.address },
    }))

    // Save notices
    await NoticeService.insertNotices([...rejectNotices, successNotice, ...rejectedUsers])

    // Send notification to current estate owner
    await NotificationsService.sendLandlordGetFinalMatch([successNotice])
    await NotificationsService.sendLandlordFinalMatchRejected(rejectNotices)
    await NotificationsService.sendProspectEstatesRentAnother(rejectedUsers)
  }

  /**
   * Get Matches with NEW status for last week (from lat friday)
   */
  static async sendProspectNewMatches() {
    const result = await Database.table({ _m: 'matches' })
      .select('_m.user_id', Database.raw('COUNT(_m.user_id) AS match_count'))
      .where('_m.status', MATCH_STATUS_NEW)
      .where('_m.updated_at', '>', moment.utc().add(-7, 'days').format(DATE_FORMAT))
      .groupBy('_m.user_id')

    if (isEmpty(result)) {
      return false
    }

    const notices = result.map(({ user_id, match_count }) => ({
      user_id,
      type: NOTICE_TYPE_PROSPECT_NEW_MATCH_ID,
      data: { match_count },
    }))

    await NoticeService.insertNotices(notices)
    const CHUNK_SIZE = 50
    await P.map(chunk(notices, CHUNK_SIZE), NotificationsService.sendProspectNewMatch, {
      concurrency: 1,
    })
  }

  /**
   *
   */
  static async getNewWeekMatches() {
    const start = moment.utc().add(-2, 'hours')
    const end = start.clone().add(5, 'min')
    const withQuery = Database.table({ _e: 'estates' })
      .select('id')
      .where({ '_e.status': STATUS_ACTIVE })
      .where('_e.available_date', '>=', start.format(DATE_FORMAT))
      .where('_e.available_date', '<', end.format(DATE_FORMAT))

    const result = await Database.table({ _l: 'likes' })
      .select('_l.user_id', '_l.estate_id', '_e.address')
      .innerJoin({ _e: 'estates' }, '_e.id', '_l.estate_id')
      .whereIn('_l.estate_id', function () {
        this.select('*').from('expiring_estates')
      })
      .with('expiring_estates', withQuery)
    // .limit(1)
    if (isEmpty(result)) {
      return false
    }

    const notices = result.map(({ estate_id, user_id, address }) => ({
      user_id,
      type: NOTICE_TYPE_PROSPECT_MATCH_LEFT_ID,
      data: {
        estate_id,
        estate_address: address,
      },
    }))
    await NoticeService.insertNotices(notices)
    await NotificationsService.sendProspectEstateExpiring(notices)
  }

  /**
   *
   */
  static async userInvite(estateId, userId) {
    const estate = await Database.table({ _e: 'estates' })
      .select('address', 'id')
      .where('id', estateId)
      .first()

    const notice = {
      user_id: userId,
      type: NOTICE_TYPE_PROSPECT_INVITE_ID,
      data: {
        estate_id: estate.id,
        estate_address: estate.address,
      },
    }
    await NoticeService.insertNotices([notice])
    await NotificationsService.sendProspectNewInvite(notice)
  }

  /**
   * Get visits in {time}
   */
  static async getVisitsIn(hours) {
    const start = moment.utc().startOf('minute').subtract(hours, 'hours')
    const end = start.clone().add(MIN_TIME_SLOT, 'minutes')

    return Database.table({ _v: 'visits' })
      .select('_v.user_id', '_v.estate_id', '_e.address')
      .innerJoin({ _e: 'estates' }, '_e.id', '_v.estate_id')
      .where('_v.date', '>=', start.format(DATE_FORMAT))
      .where('_v.date', '<', end.format(DATE_FORMAT))
      .limit(1000)
    // .limit(1)
  }

  /**
   *
   */
  static async getProspectVisitIn3H() {
    const result = await NoticeService.getVisitsIn(3)

    const notices = result.map(({ user_id, estate_id, address }) => ({
      user_id,
      type: NOTICE_TYPE_PROSPECT_VISIT3H_ID,
      data: { estate_id, estate_address: address },
    }))

    await NoticeService.insertNotices(notices)
    await NotificationsService.sendProspectFirstVisitConfirm(notices)
  }

  /**
   *
   */
  static async prospectVisitIn90m() {
    const result = await NoticeService.getVisitsIn(1.5)

    const notices = result.map(({ user_id, estate_id, address }) => ({
      user_id,
      type: NOTICE_TYPE_PROSPECT_VISIT90M_ID,
      data: { estate_id, estate_address: address },
    }))

    await NoticeService.insertNotices(notices)
    await NotificationsService.sendProspectVisit90m(notices)
  }

  /**
   *
   */
  static async getLandlordVisitsIn(hoursOffset) {
    const minDate = moment.utc().startOf('day')
    const maxDate = minDate.clone().add(1, 'day')
    const start = moment.utc().startOf('minute').subtract(hoursOffset, 'hours')
    const end = start.clone().add(MIN_TIME_SLOT, 'minutes')

    const withQuery = Database.table({ _v: 'visits' })
      .select('_v.estate_id', Database.raw('MIN(_v.date) as min_date'))
      .where('_v.date', '>=', minDate.format(DATE_FORMAT))
      .where('_v.date', '<', maxDate.format(DATE_FORMAT))
      .groupBy('_v.estate_id')

    return Database.from({ _mv: 'min_visit' })
      .select('_e.id', '_e.user_id', '_e.address')
      .innerJoin({ _e: 'estates' }, '_e.id', '_mv.estate_id')
      .where('_mv.min_date', '>=', start.format(DATE_FORMAT))
      .where('_mv.min_date', '<', end.format(DATE_FORMAT))
      .with('min_visit', withQuery)
      .limit(500)
  }

  /**
   *
   */
  static async landlordVisitIn90m() {
    const result = NoticeService.getLandlordVisitsIn(1.5)
    if (isEmpty(result)) {
      return false
    }

    const notices = result.map(({ user_id, id, address }) => ({
      user_id,
      type: NOTICE_TYPE_LANDLORD_VISIT90M_ID,
      data: { estate_id: id, estate_address: address },
    }))

    await NoticeService.insertNotices(notices)
    await NotificationsService.sendProspectVisit90m(notices)
  }

  /**
   *
   */
  static async prospectRequestConfirm(estatesId, userId) {
    const estate = await Database.table('estates').where('id', estatesId).first()
    const notice = {
      user_id: userId,
      type: NOTICE_TYPE_PROSPECT_COMMIT_ID,
      data: {
        estate_id: estatesId,
        estate_address: estate.address,
      },
    }

    await NoticeService.insertNotices([notice])
    await NotificationsService.sendProspectLandlordConfirmed(notice)
  }

  /**
   *
   */
  static async prospectProfileExpiring(skip = 0) {
    // Check is it 2 days fro month ends
    const PAGE_SIZE = 500
    if (moment().diff(moment().add(1, 'month').startOf('month'), 'days') !== -2) {
      console.log('Not 2 day before month end')
      return false
    }

    const users = await Database.table({ _u: 'users' })
      .select('_u.id')
      .innerJoin({ _t: 'tenants' }, '_t.user_id', '_u.id')
      .where({ '_u.role': ROLE_USER, '_t.status': STATUS_ACTIVE })
      .offset(skip)
      .limit(PAGE_SIZE)

    if (!users) {
      return
    }

    const notices = users.map(({ id }) => {
      return {
        user_id: id,
        type: NOTICE_TYPE_PROSPECT_PROFILE_EXPIRE_ID,
      }
    })

    await NoticeService.insertNotices(notices)
    await NotificationsService.sendProspectProfileExpiring(notices)

    // Run another page to processing
    if (notices.length === PAGE_SIZE) {
      return NoticeService.prospectProfileExpiring(skip + PAGE_SIZE)
    }
  }

  /**
   *
   */
  static async prospectVisitIn30m() {
    const result = await NoticeService.getVisitsIn(0.5)
    if (!result) {
      return false
    }

    const notices = result.map(({ user_id, estate_id, address }) => ({
      user_id,
      type: NOTICE_TYPE_PROSPECT_VISIT30M_ID,
      data: { estate_id, estate_address: address },
    }))

    await NoticeService.insertNotices(notices)
    await NotificationsService.sendProspectFinalVisitConfirm(notices)
  }

  /**
   *
   */
  static async landlordVisitIn30m() {
    const result = NoticeService.getLandlordVisitsIn(0.5)
    if (isEmpty(result)) {
      return false
    }

    const notices = result.map(({ user_id, id, address }) => ({
      user_id,
      type: NOTICE_TYPE_LANDLORD_VISIT_STARTING_ID,
      data: { estate_id: id, estate_address: address },
    }))

    await NoticeService.insertNotices(notices)
    await NotificationsService.sendLandlordVisitIn30m(notices)
  }

  /**
   *
   */
  static async getUserNoticesList(userId, dateFrom, dateTo, limit = 20) {
    const query = Notice.query().orderBy('id', 'desc').limit(limit)
    if (dateTo) {
      query.where('created_at', '>', moment.utc(dateTo).format(DATE_FORMAT))
    }

    if (dateFrom) {
      query.where('created_at', '<', moment.utc(dateFrom).format(DATE_FORMAT))
    }

    return (await query.fetch()).rows
  }
}

module.exports = NoticeService