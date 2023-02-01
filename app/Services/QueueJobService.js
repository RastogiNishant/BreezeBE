const moment = require('moment')
const Database = use('Database')
const GeoService = use('App/Services/GeoService')
const AppException = use('App/Exceptions/AppException')
const Estate = use('App/Models/Estate')
const Match = use('App/Models/Match')
const NoticeService = use('App/Services/NoticeService')
const Logger = use('Logger')
const { isEmpty, trim } = require('lodash')
const {
  STATUS_ACTIVE,
  STATUS_DRAFT,
  STATUS_EXPIRE,
  DATE_FORMAT,
  MATCH_STATUS_INVITE,
  MATCH_STATUS_KNOCK,
  MIN_TIME_SLOT,
  MATCH_STATUS_NEW,
  USER_ACTIVATION_STATUS_DEACTIVATED,
  STATUS_DELETE,
} = require('../constants')
const Promise = require('bluebird')
const UserDeactivationSchedule = require('../Models/UserDeactivationSchedule')
const ImageService = use('App/Services/ImageService')
const MemberService = use('App/Services/MemberService')
const User = use('App/Models/User')

class QueueJobService {
  static async updateEstatePoint(estateId) {
    const estate = await Estate.findOrFail(estateId)
    if (!estate) {
      throw new AppException(`Invalid estate ${estateId}`)
    }

    const { lat, lon } = estate.getLatLon()
    if (+lat === 0 && +lon === 0) {
      return false
    }
    const point = await GeoService.getOrCreatePoint({ lat, lon })
    estate.point_id = point.id
    return estate.save()
  }

  static async updateEstateCoord(estateId) {
    const estate = await Estate.find(estateId)

    if (!estate || !estate.address || trim(estate.address) === '') {
      return
    }

    const result = await GeoService.geeGeoCoordByAddress(estate.address)
    if (result && result.lat && result.lon && !isNaN(result.lat) && !isNaN(result.lon)) {
      const coord = `${result.lat},${result.lon}`
      await estate.updateItem({ coord: coord })
      await QueueJobService.updateEstatePoint(estateId)
      require('./EstateService').emitValidAddress({
        user_id: estate.user_id,
        id: estate.id,
        coord,
        address: estate.address,
      })
    }
  }

  static async updateAllMisseEstateCoord() {
    const estates =
      (
        await Estate.query()
          .select('id')
          .whereNull('coord')
          .whereNotNull('address')
          .whereNot('status', STATUS_DELETE)
          .fetch()
      ).rows || []

    let i = 0
    while (i < estates.length) {
      await QueueJobService.updateEstateCoord(estates[i].id)
      i++
    }
  }

  //Finds and handles the estates that available date is over
  static async handleExpiredEstates() {
    const estateIds = (await QueueJobService.fetchExpiredEstates()).rows.map((i) => i.id)
    if (isEmpty(estateIds)) {
      return false
    }

    const trx = await Database.beginTransaction()
    try {
      await Estate.query()
        .update({ status: STATUS_EXPIRE })
        .whereIn('id', estateIds)
        .transacting(trx)

      // Delete new matches
      await Match.query()
        .whereIn('estate_id', estateIds)
        .where('status', MATCH_STATUS_NEW)
        .delete()
        .transacting(trx)

      await NoticeService.landlordEstateExpired(estateIds)
      await trx.commit()
    } catch (e) {
      await trx.rollback()
      Logger.error(e)
      return false
    }
  }

  static async fetchExpiredEstates() {
    return Estate.query()
      .select('id')
      .where('status', STATUS_ACTIVE)
      .where('available_date', '<=', moment().format(DATE_FORMAT))
      .fetch()
  }

  //Finds and handles the estates that show date is over between now and 5 minutes before
  static async handleShowDateEndedEstates() {
    const showedEstates = (await QueueJobService.fetchShowDateEndedEstatesFor5Minutes()).rows
    const estateIds = showedEstates.map((e) => e.id)
    if (isEmpty(estateIds)) {
      return false
    }
    const trx = await Database.beginTransaction()
    try {
      await QueueJobService.handleShowDateEndedEstatesMatches(estateIds, trx)
      await NoticeService.sendToShowDateIsEndedEstatesLandlords(showedEstates)
      await trx.commit()
    } catch (e) {
      await trx.rollback()
      console.log(e)
      return false
    }

    return true
  }

  static async fetchShowDateEndedEstatesFor5Minutes() {
    const start = moment().startOf('minute').subtract(5, 'minutes')
    const end = start.clone().add(MIN_TIME_SLOT, 'minutes')

    return Database.raw(
      `
          SELECT estates.* FROM estates
          INNER JOIN time_slots on time_slots.estate_id = estates.id
          WHERE end_at IN (SELECT max(end_at) FROM time_slots WHERE estate_id = estates.id)
          AND estates.status IN (${STATUS_ACTIVE},${STATUS_EXPIRE})
          AND end_at >= '${start.format(DATE_FORMAT)}'
          AND end_at <= '${end.format(DATE_FORMAT)}'
          ORDER BY estates.id
        `
    )
  }

  static async handleShowDateEndedEstatesMatches(estateIds, trx) {
    // We move "invite" matches to "knock".
    // Because estate's timeslots(show date) is over and the prospects are not able to pick timeslot anymore
    await Database.table('matches')
      .where('status', MATCH_STATUS_INVITE)
      .whereIn('estate_id', estateIds)
      .update({ status: MATCH_STATUS_KNOCK })
      .transacting(trx)
  }

  static async handleShowDateWillEndInAnHourEstates() {
    const showDateWillEndEstates = (await QueueJobService.fetchShowDateWillEndInAnHourEstates())
      .rows
    if (isEmpty(showDateWillEndEstates)) {
      return false
    }

    try {
      await NoticeService.sendProspectsWillLoseBookingTimeSlotChance(showDateWillEndEstates)
    } catch (e) {
      console.log(e)
      return false
    }

    return true
  }

  static async fetchShowDateWillEndInAnHourEstates() {
    const anHourLater = moment().add(1, 'hour').startOf('minute')
    const start = anHourLater.subtract(5, 'minutes')
    const end = anHourLater.clone().add(MIN_TIME_SLOT, 'minutes')

    return Database.raw(
      `
          SELECT estates.id as estate_id, matches.user_id as prospect_id, address, cover FROM estates
          INNER JOIN time_slots on time_slots.estate_id = estates.id
          INNER JOIN matches on matches.estate_id = estates.id
          WHERE end_at IN (SELECT max(end_at) FROM time_slots WHERE estate_id = estates.id)
          AND matches.status = ${MATCH_STATUS_INVITE}
          AND estates.status IN (${STATUS_ACTIVE},${STATUS_EXPIRE})
          AND end_at >= '${start.format(DATE_FORMAT)}'
          AND end_at <= '${end.format(DATE_FORMAT)}'
          ORDER BY estates.id
        `
    )
  }

  static async createThumbnailImages() {
    await Promise.all([ImageService.createThumbnail(), MemberService.createThumbnail()])
  }

  static async deactivateLandlord(deactivationId, userId) {
    const deactivationSchedule = await UserDeactivationSchedule.query()
      .where('id', deactivationId)
      .where('user_id', userId)
      .first()
    if (deactivationSchedule) {
      const trx = await Database.beginTransaction()
      try {
        await User.query().where('id', userId).update(
          {
            activation_status: USER_ACTIVATION_STATUS_DEACTIVATED,
          },
          trx
        )

        await Estate.query()
          .where('user_id', userId)
          .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
          .update({ status: STATUS_DRAFT }, trx)

        await UserDeactivationSchedule.query()
          .where('id', deactivationId)
          .where('user_id', userId)
          .delete(trx)
        await trx.commit()
        Event.fire('mautic:syncContact', userId, { admin_approval_date: null })
      } catch (err) {
        await trx.rollback()
        console.log(err.message)
      }
    } else {
      console.log(`deactivating ${deactivationId} is not valid anymore.`)
    }
  }

  static async getIpBasedInfo(userId, ip) {
    const { getIpBasedInfo } = require('../Libs/getIpBasedInfo')
    const ip_based_info = await getIpBasedInfo(ip)
    await User.query().where('id', userId).update({ ip_based_info })
  }
}

module.exports = QueueJobService
