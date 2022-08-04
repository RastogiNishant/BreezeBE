'use strict'

const { isEmpty, chunk } = require('lodash')
const moment = require('moment')
const P = require('bluebird')
const File = use('App/Classes/File')
const Database = use('Database')
const UserService = use('App/Services/UserService')
const User = use('App/Models/User')
const Notice = use('App/Models/Notice')
const Estate = use('App/Models/Estate')
const NotificationsService = use('App/Services/NotificationsService')
const MailService = use('App/Services/MailService')
const Logger = use('Logger')

const {
  ROLE_USER,
  DATE_FORMAT,
  NOTICE_TYPE_LANDLORD_FILL_PROFILE_ID,
  NOTICE_TYPE_LANDLORD_NEW_PROPERTY_ID,
  NOTICE_TYPE_LANDLORD_TIME_FINISHED_ID,
  NOTICE_TYPE_LANDLORD_CONFIRM_VISIT_ID,
  NOTICE_TYPE_LANDLORD_VISIT30M_ID,
  NOTICE_TYPE_LANDLORD_MATCH_ID,
  NOTICE_TYPE_LANDLORD_DECISION_ID,
  NOTICE_TYPE_PROSPECT_NEW_MATCH_ID,
  NOTICE_TYPE_PROSPECT_MATCH_LEFT_ID,
  NOTICE_TYPE_PROSPECT_INVITE_ID,
  NOTICE_TYPE_PROSPECT_VISIT3H_ID,
  NOTICE_TYPE_PROSPECT_VISIT90M_ID,
  NOTICE_TYPE_LANDLORD_VISIT90M_ID,
  NOTICE_TYPE_PROSPECT_VISIT30M_ID,
  NOTICE_TYPE_PROSPECT_COMMIT_ID,
  NOTICE_TYPE_PROSPECT_REJECT_ID,
  NOTICE_TYPE_PROSPECT_NO_ACTIVITY_ID,
  NOTICE_TYPE_PROSPECT_PROFILE_EXPIRE_ID,
  NOTICE_TYPE_PROSPECT_COME_ID,
  NOTICE_TYPE_CANCEL_VISIT_ID,
  NOTICE_TYPE_VISIT_DELAY_ID,
  NOTICE_TYPE_VISIT_DELAY_LANDLORD_ID,
  NOTICE_TYPE_LANDLORD_FOLLOWUP_PROSPECT_ID,
  NOTICE_TYPE_PROSPECT_FOLLOWUP_LANDLORD_ID,

  NOTICE_TYPE_LANDLORD_FILL_PROFILE,
  NOTICE_TYPE_LANDLORD_NEW_PROPERTY,
  NOTICE_TYPE_LANDLORD_TIME_FINISHED,
  NOTICE_TYPE_LANDLORD_CONFIRM_VISIT,
  NOTICE_TYPE_LANDLORD_VISIT30M,
  NOTICE_TYPE_LANDLORD_MATCH,
  NOTICE_TYPE_LANDLORD_DECISION,
  NOTICE_TYPE_PROSPECT_NEW_MATCH,
  NOTICE_TYPE_PROSPECT_MATCH_LEFT,
  NOTICE_TYPE_PROSPECT_INVITE,
  NOTICE_TYPE_PROSPECT_VISIT3H,
  NOTICE_TYPE_PROSPECT_VISIT90M,
  NOTICE_TYPE_LANDLORD_VISIT90M,
  NOTICE_TYPE_PROSPECT_VISIT30M,
  NOTICE_TYPE_PROSPECT_COMMIT,
  NOTICE_TYPE_PROSPECT_REJECT,
  NOTICE_TYPE_PROSPECT_NO_ACTIVITY,
  NOTICE_TYPE_PROSPECT_PROFILE_EXPIRE,
  NOTICE_TYPE_PROSPECT_COME,
  NOTICE_TYPE_CANCEL_VISIT,
  NOTICE_TYPE_VISIT_DELAY,
  NOTICE_TYPE_VISIT_DELAY_LANDLORD,
  NOTICE_TYPE_LANDLORD_FOLLOWUP_PROSPECT,
  NOTICE_TYPE_PROSPECT_FOLLOWUP_LANDLORD,

  MATCH_STATUS_COMMIT,
  MATCH_STATUS_TOP,
  MATCH_STATUS_NEW,
  STATUS_ACTIVE,
  NOTICE_TYPE_INVITE_TENANT_IN_TO_VISIT_ID,
  NOTICE_TYPE_ZENDESK_NOTIFY_ID,
  NOTICE_TYPE_USER_VERIFICATION_BY_ADMIN_ID,
  NOTICE_TYPE_ESTATE_SHOW_TIME_IS_OVER_ID,
  NOTICE_TYPE_PROSPECT_IS_NOT_INTERESTED_ID,
  NOTICE_TYPE_LANDLORD_MOVED_PROSPECT_TO_TOP_ID,
  NOTICE_TYPE_PROSPECT_HOUSEHOLD_INVITATION_ACCEPTED_ID,
  NOTICE_TYPE_PROSPECT_HOUSEHOLD_DISCONNECTED_ID,
  MIN_TIME_SLOT,
  NOTICE_TYPE_PROSPECT_INVITE_REMINDER_ID,
  NOTICE_TYPE_CANCEL_VISIT_LANDLORD_ID,
  GERMAN_DATE_TIME_FORMAT,
  NOTICE_TYPE_PROSPECT_ARRIVED_ID,
  MATCH_STATUS_FINISH,
  NOTICE_TYPE_PROSPECT_PROPERTY_DEACTIVATED_ID,
  NOTICE_TYPE_PROSPECT_SUPER_MATCH_ID,
  DEFAULT_LANG,
} = require('../constants')

class NoticeService {
  /**
   * Insert multiple notices
   */
  static async insertNotices(data) {
    const promises = []
    data.map((item) => {
      promises.push(
        UserService.increaseUnreadNotificationCount(item.user_id).catch((e) => console.log(e))
      )
    })
    promises.push(
      Database.from('notices').insert(
        data.map(({ user_id, type, data }) => ({
          user_id,
          type,
          data,
          created_at: Database.fn.now(),
          updated_at: Database.fn.now(),
        }))
      )
    )
    return Promise.all(promises)
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
    const dateTo = moment().startOf('day').add(-2, 'days')
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
   * On estate deactivation, send to matched prospects
   */
  static async prospectPropertDeactivated(estates) {
    const notices = estates.map(({ address, id, cover, prospect_id }) => ({
      user_id: prospect_id,
      type: NOTICE_TYPE_PROSPECT_PROPERTY_DEACTIVATED_ID,
      data: { estate_id: id, estate_address: address },
      image: File.getPublicUrl(cover),
    }))
    await NoticeService.insertNotices(notices)
    await NotificationsService.sendProspectPropertyDeactivated(notices)
  }

  /**
   * On estate expiration, send to landlord
   */
  static async landLandlordEstateExpired(estateIds) {
    if (isEmpty(estateIds)) {
      return false
    }

    // Get just expired estate data
    const data = await Database.select('_e.address', '_e.id', '_e.user_id', '_e.cover')
      .table({ _e: 'estates' })
      .whereIn('_e.id', estateIds)

    // Create new notice items
    const notices = data.map(({ address, id, user_id, cover }) => ({
      user_id,
      type: NOTICE_TYPE_LANDLORD_TIME_FINISHED_ID,
      data: { estate_id: id, estate_address: address },
      image: File.getPublicUrl(cover),
    }))
    await NoticeService.insertNotices(notices)
    await NotificationsService.sendEstateExpired(notices)
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
      date: moment().format(GERMAN_DATE_TIME_FORMAT),
    }

    const notice = {
      user_id: estate.user_id,
      type: NOTICE_TYPE_LANDLORD_CONFIRM_VISIT_ID,
      data,
      image: File.getPublicUrl(estate.cover),
    }
    await NoticeService.insertNotices([notice])
    await NotificationsService.sendLandlordSlotsSelected([notice])
  }

  /**
   *
   */
  static async estateFinalConfirm(estateId, userId) {
    const getCurrentEstate = () => {
      return Database.table('estates')
        .select('address', 'user_id', 'id', 'cover')
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
        })
        .whereIn('_m.status', [MATCH_STATUS_COMMIT, MATCH_STATUS_TOP])
        .whereNot('_e.id', estateId)
    }

    // Another users from current estate
    const getAnotherUsersCurEstate = () => {
      return Database.table({ _m: 'matches' })
        .select('_m.user_id')
        .where({ '_m.estate_id': estateId })
        .whereNotIn('_m.status', [MATCH_STATUS_NEW, MATCH_STATUS_FINISH])
        .whereNot('_m.user_id', userId)
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
      image: File.getPublicUrl(estate.cover),
    }

    const rejectNotices = anotherEstates.map(({ user_id, address, id }) => ({
      user_id,
      type: NOTICE_TYPE_LANDLORD_DECISION_ID,
      data: { estate_id: id, estate_address: address },
      image: File.getPublicUrl(estate.cover),
    }))

    const rejectedUsers = anotherUsers.map(({ user_id }) => ({
      user_id,
      type: NOTICE_TYPE_PROSPECT_REJECT_ID,
      data: { estate_id: estate.id, estate_address: estate.address },
      image: File.getPublicUrl(estate.cover),
    }))

    // Save notices
    await NoticeService.insertNotices([...rejectNotices, successNotice, ...rejectedUsers])
    try {
      // Send notification to current estate owner
      await NotificationsService.sendLandlordGetFinalMatch([successNotice])
      await NotificationsService.sendLandlordFinalMatchRejected(rejectNotices)
      await NotificationsService.sendProspectEstatesRentAnother(rejectedUsers)
    } catch (e) {
      console.log(e)
    }

    return estate
  }

  /**
   * Get Matches with NEW status for last week (from lat friday)
   */
  static async sendProspectNewMatches() {
    const result = await Database.table({ _m: 'matches' })
      .select('_m.user_id', Database.raw('COUNT(_m.user_id) AS match_count'))
      .where('_m.status', MATCH_STATUS_NEW)
      .where('_m.updated_at', '>', moment().add(-7, 'days').format(DATE_FORMAT))
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
    const start = moment().add(2, 'hours').startOf('minute')
    const end = start.clone().add(5, 'min')
    const withQuery = Database.table({ _e: 'estates' })
      .select('id')
      .where({ '_e.status': STATUS_ACTIVE })
      .where('_e.available_date', '>=', start.format(DATE_FORMAT))
      .where('_e.available_date', '<', end.format(DATE_FORMAT))

    const result = await Database.table({ _l: 'likes' })
      .select('_l.user_id', '_l.estate_id', '_e.address', '_e.cover')
      .innerJoin({ _e: 'estates' }, '_e.id', '_l.estate_id')
      .whereIn('_l.estate_id', function () {
        this.select('*').from('expiring_estates')
      })
      .with('expiring_estates', withQuery)
    // .limit(1)
    if (isEmpty(result)) {
      return false
    }

    const notices = result.map(({ estate_id, user_id, address, cover }) => ({
      user_id,
      type: NOTICE_TYPE_PROSPECT_MATCH_LEFT_ID,
      data: {
        estate_id,
        estate_address: address,
      },
      image: File.getPublicUrl(cover),
    }))
    await NoticeService.insertNotices(notices)
    await NotificationsService.sendProspectEstateExpiring(notices)
  }

  /**
   *
   */
  static async userInvite(estateId, userId) {
    const estate = await Database.table({ _e: 'estates' })
      .select('address', 'id', 'cover')
      .where('id', estateId)
      .first()

    const notice = {
      user_id: userId,
      type: NOTICE_TYPE_PROSPECT_INVITE_ID,
      data: {
        estate_id: estate.id,
        estate_address: estate.address,
      },
      image: File.getPublicUrl(estate.cover),
    }
    await NoticeService.insertNotices([notice])
    await NotificationsService.sendProspectNewInvite(notice)
  }

  /**
   * Notify landlord or prospect that visit has been canceled
   * parameters
   * userId : null => prospect cancel his visit
   * userId: not null => landlord cancel his visit
   */
  static async cancelVisit(estateId, userId = null, tenantId = null) {
    const estate = await Database.table({ _e: 'estates' })
      .select('address', 'id', 'cover', 'user_id')
      .where('id', estateId)
      .first()
    if (!estate || !estate.user_id) {
      Logger.error('knockToLandloard', `there is no estate for${estateId}`)
      throw new AppException('there is no estate')
    }

    const notificationUser = tenantId
      ? await User.query().where('id', tenantId).firstOrFail()
      : null

    const notice = {
      user_id: userId ? userId : estate.user_id,
      type: userId ? NOTICE_TYPE_CANCEL_VISIT_LANDLORD_ID : NOTICE_TYPE_CANCEL_VISIT_ID,
      data: {
        estate_id: estate.id,
        estate_address: estate.address,
        user_name: tenantId ? `${notificationUser.firstname || ''}` : null,
      },
      image: File.getPublicUrl(estate.cover),
    }

    await NoticeService.insertNotices([notice])
    if (userId) {
      await NotificationsService.sendLandlordCancelVisit([notice])
    } else {
      await NotificationsService.sendProspectCancelVisit([notice])
    }
  }

  /**
   * Get visits in {time}
   */
  static async getVisitsIn(hours) {
    const start = moment().startOf('minute').add(hours, 'hours').add(2, hours) // 2 hours for the German timezone
    const end = start.clone().add(MIN_TIME_SLOT, 'minutes')

    return Database.table({ _v: 'visits' })
      .select('_v.user_id', '_v.estate_id', '_e.address', '_e.cover', '_u.email', '_u.lang')
      .innerJoin({ _e: 'estates' }, '_e.id', '_v.estate_id')
      .innerJoin({ _u: 'users' }, '_u.id', '_v.user_id')
      .where('_v.date', '>=', start.format(DATE_FORMAT))
      .where('_v.date', '<', end.format(DATE_FORMAT))
      .limit(1000)
  }

  static async inviteTenantInToVisit(estateId, tenantId) {
    const estate = await Database.table({ _e: 'estates' })
      .select('address', 'id', 'cover', 'user_id')
      .where('id', estateId)
      .first()
    if (!estate || !estate.user_id) {
      Logger.error('knockToLandloard', `there is no estate for${estateId}`)
      throw new AppException('there is no estate')
    }
    const notice = {
      user_id: tenantId,
      type: NOTICE_TYPE_INVITE_TENANT_IN_TO_VISIT_ID,
      data: {
        estate_id: estateId,
        estate_address: estate.address,
      },
      image: File.getPublicUrl(estate.cover),
    }
    await NoticeService.insertNotices([notice])
    await NotificationsService.sendTenantInviteInToVisit([notice])
  }

  /**
   *
   */
  static async getProspectVisitIn3H() {
    const result = await NoticeService.getVisitsIn(3)

    result.map((r) => {
      const lang = r.lang ? r.lang : DEFAULT_LANG
      MailService.notifyVisitEmailToProspect({ email: r.email, address: r.address, lang: lang })
    })

    const notices = result.map(({ user_id, estate_id, address, cover }) => ({
      user_id,
      type: NOTICE_TYPE_PROSPECT_VISIT3H_ID,
      data: { estate_id, estate_address: address },
      image: File.getPublicUrl(cover),
    }))

    await NoticeService.insertNotices(notices)
    await NotificationsService.sendProspectFirstVisitConfirm(notices)
  }

  /**
   *
   */
  static async prospectVisitIn90m() {
    const result = await NoticeService.getVisitsIn(1.5)

    const notices = result.map(({ user_id, estate_id, address, cover }) => ({
      user_id,
      type: NOTICE_TYPE_PROSPECT_VISIT90M_ID,
      data: { estate_id, estate_address: address },
      image: File.getPublicUrl(cover),
    }))

    await NoticeService.insertNotices(notices)
    await NotificationsService.sendProspectVisit90m(notices)
  }

  /**
   *
   */
  static async getLandlordVisitsIn(hoursOffset) {
    const minDate = moment().startOf('day')
    const maxDate = minDate.clone().add(1, 'day')
    const start = moment().startOf('minute').add(hoursOffset, 'hours').add(2, hours) // 2 hours for the German timezone
    const end = start.clone().add(MIN_TIME_SLOT, 'minutes')

    const withQuery = Database.table({ _v: 'visits' })
      .select('_v.estate_id', Database.raw('MIN(_v.date) as min_date'))
      .where('_v.date', '>=', minDate.format(DATE_FORMAT))
      .where('_v.date', '<', maxDate.format(DATE_FORMAT))
      .groupBy('_v.estate_id')

    return Database.from({ _mv: 'min_visit' })
      .select('_e.id', '_e.user_id', '_e.address', '_e.cover')
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
    const result = await NoticeService.getLandlordVisitsIn(1.5)
    if (isEmpty(result)) {
      return false
    }

    const notices = result.map(({ user_id, id, address, cover }) => ({
      user_id,
      type: NOTICE_TYPE_LANDLORD_VISIT90M_ID,
      data: { estate_id: id, estate_address: address },
      image: File.getPublicUrl(cover),
    }))

    await NoticeService.insertNotices(notices)
    await NotificationsService.sendLandlordVisit90m(notices)
  }

  /**
   *
   */
  static async prospectRequestConfirm(estateId, userId) {
    const estate = await Estate.query().where('id', estateId).first()
    const notice = {
      user_id: userId,
      type: NOTICE_TYPE_PROSPECT_COMMIT_ID,
      data: {
        estate_id: estateId,
        estate_address: estate.address,
        params: estate.getAptParams(),
      },
      image: File.getPublicUrl(estate.cover),
    }

    await NoticeService.insertNotices([notice])
    await NotificationsService.sendProspectLandlordConfirmed(notice)
  }

  /**
   *
   */
  static async prospectSuperMatch(estateId, matches) {
    if (matches.length > 0) {
      const estate = await Estate.query().select('*').where('id', estateId).first()

      const notices = matches.map(({ user_id }) => {
        return {
          user_id,
          type: NOTICE_TYPE_PROSPECT_SUPER_MATCH_ID,
          data: {
            estate_id: estateId,
            estate_address: estate.address,
            params: estate.getAptParams(),
          },
          image: File.getPublicUrl(estate.cover),
        }
      })
      await NoticeService.insertNotices(notices)
      await NotificationsService.sendProspectHasSuperMatch(notices)
    }
  }

  /**
   *
   */
  static async prospectProfileExpiring(skip = 0) {
    // Check is it 2 days fro month ends
    const PAGE_SIZE = 500
    if (moment().diff(moment().add(1, 'month').startOf('month'), 'days') !== -2) {
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

    const notices = result.map(({ user_id, estate_id, address, cover }) => ({
      user_id,
      type: NOTICE_TYPE_PROSPECT_VISIT30M_ID,
      data: { estate_id, estate_address: address },
      image: File.getPublicUrl(cover),
    }))

    await NoticeService.insertNotices(notices)
    await NotificationsService.sendProspectFinalVisitConfirm(notices)
  }

  /**
   *
   */
  static async landlordVisitIn30m() {
    const result = await NoticeService.getLandlordVisitsIn(0.5)
    if (isEmpty(result)) {
      return false
    }

    const notices = result.map(({ user_id, id, address, cover }) => ({
      user_id,
      type: NOTICE_TYPE_LANDLORD_VISIT30M_ID,
      data: { estate_id: id, estate_address: address },
      image: File.getPublicUrl(cover),
    }))

    await NoticeService.insertNotices(notices)
    await NotificationsService.sendLandlordVisitIn30m(notices)
  }

  /**
   *
   */
  static async getUserNoticesList(userId, dateFrom, dateTo, estate_id = null, limit = 20) {
    const query = Notice.query().orderBy('id', 'desc').where('user_id', userId).limit(limit)
    if (dateTo) {
      query.where('created_at', '>', moment.utc(dateTo).add(1, 'seconds').format(DATE_FORMAT))
    }

    if (dateFrom) {
      query.where('created_at', '<', moment.utc(dateFrom).format(DATE_FORMAT))
    }

    return (await query.fetch()).rows
  }

  /**
   *
   */
  static async sendTestNotification(userId, type, estateId, extraData = {}) {
    const estate = await Database.table('estates').where('id', estateId).first()
    const notice = {
      user_id: userId,
      type: NotificationsService.getIdByType(type),
      data: {
        ...extraData,
        estate_id: estate.id,
        estate_address: estate.address,
      },
      image: File.getPublicUrl(estate.cover),
    }

    switch (type) {
      case NOTICE_TYPE_LANDLORD_FILL_PROFILE:
        return NotificationsService.sendLandlordNoProperty([notice])
      case NOTICE_TYPE_LANDLORD_NEW_PROPERTY:
        return NotificationsService.sendLandlordNewProperty([notice])
      case NOTICE_TYPE_LANDLORD_TIME_FINISHED:
        return NotificationsService.sendEstateExpired([notice])
      case NOTICE_TYPE_LANDLORD_CONFIRM_VISIT:
        return NotificationsService.sendLandlordSlotsSelected([notice])
      case NOTICE_TYPE_LANDLORD_VISIT30M:
        return NotificationsService.sendLandlordVisitIn30m([notice])
      case NOTICE_TYPE_LANDLORD_MATCH:
        return NotificationsService.sendLandlordGetFinalMatch([notice])
      case NOTICE_TYPE_LANDLORD_DECISION:
        return NotificationsService.sendLandlordFinalMatchRejected([notice])
      case NOTICE_TYPE_PROSPECT_NEW_MATCH:
        return NotificationsService.sendProspectNewMatch([notice])
      case NOTICE_TYPE_PROSPECT_MATCH_LEFT:
        return NotificationsService.sendProspectEstateExpiring([notice])
      case NOTICE_TYPE_PROSPECT_INVITE:
        return NotificationsService.sendProspectNewInvite(notice)
      case NOTICE_TYPE_PROSPECT_VISIT3H:
        return NotificationsService.sendProspectFirstVisitConfirm([notice])
      case NOTICE_TYPE_PROSPECT_VISIT90M:
        return NotificationsService.sendProspectVisit90m([notice])
      case NOTICE_TYPE_LANDLORD_VISIT90M:
        return NotificationsService.sendLandlordVisit90m([notice])
      case NOTICE_TYPE_PROSPECT_VISIT30M:
        return NotificationsService.sendProspectFinalVisitConfirm([notice])
      case NOTICE_TYPE_PROSPECT_COMMIT:
        return NotificationsService.sendProspectLandlordConfirmed(notice)
      case NOTICE_TYPE_PROSPECT_REJECT:
        return NotificationsService.sendProspectEstatesRentAnother([notice])
      case NOTICE_TYPE_PROSPECT_NO_ACTIVITY:
        return NotificationsService.sendProspectNoActivity([notice])
      case NOTICE_TYPE_PROSPECT_PROFILE_EXPIRE:
        return NotificationsService.sendProspectProfileExpiring([notice])
      case NOTICE_TYPE_PROSPECT_COME:
        return NotificationsService.sendProspectProfileExpiring([notice])
      case NOTICE_TYPE_CANCEL_VISIT:
        notice.user_id = estate.user_id
        return NotificationsService.sendProspectCancelVisit([notice])
      case NOTICE_TYPE_LANDLORD_CONFIRM_VISIT: // Notification for prospect's picking up timeslot to visit landlord
        notice.user_id = estate.user_id
        return NotificationsService.sendLandlordSlotsSelected([notice])
      case NOTICE_TYPE_VISIT_DELAY:
        return NotificationsService.sendChangeVisitTime([notice])
      case NOTICE_TYPE_VISIT_DELAY_LANDLORD:
        return NotificationsService.sendChangeVisitTime([notice])
    }
  }

  /**
   *
   */
  static async inviteUserToCome(estateId, userId) {
    const estate = await Database.table('estates').where('id', estateId).first()
    const notice = {
      user_id: userId,
      type: NOTICE_TYPE_PROSPECT_COME_ID,
      data: {
        estate_id: estate.id,
        estate_address: estate.address,
      },
      image: File.getPublicUrl(estate.cover),
    }

    await NotificationsService.sendProspectInviteToCome([notice])
  }

  /**
   *
   */
  static async changeVisitTime(estateId, userId, delay, prospectId) {
    const estate = await Database.table({ _e: 'estates' })
      .select('address', 'id', 'cover')
      .where('id', estateId)
      .first()

    const notificationUser = prospectId
      ? await User.query().where('id', prospectId).firstOrFail()
      : {}

    const notice = {
      user_id: userId,
      type: prospectId ? NOTICE_TYPE_VISIT_DELAY_ID : NOTICE_TYPE_VISIT_DELAY_LANDLORD_ID,
      data: {
        estate_id: estate.id,
        estate_address: estate.address,
        delay: delay,
        user_name: prospectId ? `${notificationUser.firstname || ''}` : undefined,
      },
      image: File.getPublicUrl(estate.cover),
    }

    await NoticeService.insertNotices([notice])

    if (prospectId) {
      await NotificationsService.sendChangeVisitTimeProspect([notice])
    } else {
      await NotificationsService.sendChangeVisitTimeLandlord([notice])
    }
  }

  /**
   *
   */
  static async prospectArrived(estateId, prospectId) {
    const estate = await Estate.query().where('id', estateId).first()
    const prospect = await User.query().where('id', prospectId).first()
    if (estate && prospect) {
      const notice = {
        user_id: estate.user_id,
        type: NOTICE_TYPE_PROSPECT_ARRIVED_ID,
        data: {
          estate_id: estateId,
          estate_address: estate.address,
          params: estate.getAptParams(),
          user_name: `${prospect.firstname || ''}`,
        },
        image: File.getPublicUrl(estate.cover),
      }
      await NoticeService.insertNotices([notice])
      await NotificationsService.sendProspectArrived([notice])
    }
  }

  static async verifyUserByAdmin(userIds = []) {
    const notices = userIds.map((id) => ({
      user_id: id,
      type: NOTICE_TYPE_USER_VERIFICATION_BY_ADMIN_ID,
    }))
    await NoticeService.insertNotices(notices)
    await NotificationsService.sendLandlordIsVerifiedByAdmin(notices)
  }

  static async sendToShowDateIsEndedEstatesLandlords(showedEstates = []) {
    const notices = showedEstates.map(({ id, user_id, address, cover }) => ({
      user_id,
      type: NOTICE_TYPE_ESTATE_SHOW_TIME_IS_OVER_ID,
      data: { estate_id: id, estate_address: address },
      image: File.getPublicUrl(cover),
    }))

    await NoticeService.insertNotices(notices)
    await NotificationsService.sendLandlordEstateShowDateIsEnded(notices)
  }

  static async sendProspectsWillLoseBookingTimeSlotChance(estates) {
    const notices = estates.map(({ estate_id, address, prospect_id, cover }) => ({
      user_id: prospect_id,
      type: NOTICE_TYPE_PROSPECT_INVITE_REMINDER_ID,
      data: { estate_id, estate_address: address },
      image: File.getPublicUrl(cover),
    }))

    await NoticeService.insertNotices(notices)
    await NotificationsService.sendProspectWillLoseBookingTimeSlotChance(notices)
  }

  /**
   *
   */
  static async prospectIsNotInterested(estateId) {
    const estate = await Estate.query().where('id', estateId).first()
    if (estate) {
      const notice = {
        user_id: estate.user_id,
        type: NOTICE_TYPE_PROSPECT_IS_NOT_INTERESTED_ID,
        data: {
          estate_id: estateId,
          estate_address: estate.address,
          params: estate.getAptParams(),
        },
        image: File.getPublicUrl(estate.cover),
      }
      await NoticeService.insertNotices([notice])
      await NotificationsService.sendProspectIsNotInterested([notice])
    }
  }

  static async landlordMovedProspectToTop(estateId, userId) {
    const estate = await Database.table({ _e: 'estates' })
      .select('address', 'id', 'cover')
      .where('id', estateId)
      .first()

    const notice = {
      user_id: userId,
      type: NOTICE_TYPE_LANDLORD_MOVED_PROSPECT_TO_TOP_ID,
      data: {
        estate_id: estate.id,
        estate_address: estate.address,
      },
      image: File.getPublicUrl(estate.cover),
    }
    await NoticeService.insertNotices([notice])
    await NotificationsService.sendLandlordMovedProspectToTop([notice])
  }

  static async prospectHouseholdInvitationAccepted(userId) {
    const notice = {
      user_id: userId,
      type: NOTICE_TYPE_PROSPECT_HOUSEHOLD_INVITATION_ACCEPTED_ID,
    }
    await NoticeService.insertNotices([notice])
    await NotificationsService.sendProspectHouseholdInvitationAccepted([notice])
  }

  static async prospectHouseholdDisconnected(userId) {
    const notice = {
      user_id: userId,
      type: NOTICE_TYPE_PROSPECT_HOUSEHOLD_DISCONNECTED_ID,
    }
    await NoticeService.insertNotices([notice])
    await NotificationsService.sendProspectHouseholdDisconnected([notice])
  }

  /**
   * 
   * @param {*} userIds 
   * @param {*} notification 
   * 
   * notification: {
    "body": "Agent replied something something",
    "title": "Agent replied",
    "ticket_id": "5"
    }
   */
  static async zendeskNotice(userIds, notification) {
    const notices = userIds.map(function (id) {
      return {
        user_id: id,
        type: NOTICE_TYPE_ZENDESK_NOTIFY_ID,
        data: {
          ticket_id: notification.ticket_id ? notification.ticket_id : '',
        },
      }
    })

    await NoticeService.insertNotices(notices)
    await NotificationsService.sendZendeskNotification(
      notices,
      notification.title,
      notification.body
    )
  }

  static async followupVisit(recipient, actor, estate) {
    const notice = {
      user_id: recipient,
      type:
        actor == 'landlord'
          ? NOTICE_TYPE_LANDLORD_FOLLOWUP_PROSPECT_ID
          : NOTICE_TYPE_PROSPECT_FOLLOWUP_LANDLORD_ID,
      data: {
        actor,
        estate_address: estate.address,
      },
      image: File.getPublicUrl(estate.cover),
    }
    await NoticeService.insertNotices([notice])
    await NotificationsService.notifyFollowupVisit(notice)
  }
}

module.exports = NoticeService
