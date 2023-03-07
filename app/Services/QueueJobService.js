const moment = require('moment')
const { toXML } = require('jstoxml')
const Database = use('Database')
const GeoService = use('App/Services/GeoService')
const AppException = use('App/Exceptions/AppException')
const Estate = use('App/Models/Estate')
const Match = use('App/Models/Match')
const ThirdPartyOffer = use('App/Models/ThirdPartyOffer')
const NoticeService = use('App/Services/NoticeService')
const Logger = use('Logger')
const l = use('Localize')
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
  COMPLETE_CERTAIN_PERCENT,
  PUBLISH_ESTATE,
  CONNECT_ESTATE,
  COMPLETE_CERTAIN_PERCENT_EMAIL_SUBJECT,
  PUBLISH_ESTATE_EMAIL_SUBJECT,
  CONNECT_ESTATE_EMAIL_SUBJECT,
  SEND_TO_SUPPORT_HTML_MESSAGE_TEMPLATE,
  SEND_TO_SUPPORT_TEXT_MESSAGE_TEMPLATE,
  ESTATE_COMPLETENESS_BREAKPOINT,
  GENDER_MALE,
  GENDER_FEMALE,
  SALUTATION_MS_LABEL,
  GENDER_ANY,
  SALUTATION_MR_LABEL,
  SALUTATION_SIR_OR_MADAM_LABEL,
  GENDER_NEUTRAL,
  SALUTATION_NEUTRAL_LABEL,
} = require('../constants')
const Promise = require('bluebird')
const UserDeactivationSchedule = require('../Models/UserDeactivationSchedule')
const MailService = use('App/Services/MailService')
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
      await trx.commit()
      NoticeService.landlordEstateExpired(estateIds)
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
      .where(
        'available_date',
        '<=',
        moment().utc().add(avail_duration, 'hours').format(DATE_FORMAT)
      )
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

  static async sendEmailToSupportForLandlordUpdate({ type, landlordId, estateIds }) {
    const estateQuery = Estate.query()
      .select(Database.raw(`count(estates.id) as affected`))
      .whereNot('estates.status', STATUS_DELETE)
      .where('estates.user_id', landlordId)
      .whereNotIn('estates.id', estateIds)

    let subject = ''
    let htmlMessage = SEND_TO_SUPPORT_HTML_MESSAGE_TEMPLATE
    let textMessage = SEND_TO_SUPPORT_TEXT_MESSAGE_TEMPLATE
    let otherEstates
    let estates
    let estateContent
    switch (type) {
      case COMPLETE_CERTAIN_PERCENT:
        otherEstates = await estateQuery
          .where('percent', '>=', ESTATE_COMPLETENESS_BREAKPOINT)
          .first()
        if (+otherEstates.affected === 0) {
          //this is the first one(s)... we need to notify support
          subject = COMPLETE_CERTAIN_PERCENT_EMAIL_SUBJECT
        }
        break

      case PUBLISH_ESTATE:
        otherEstates = await estateQuery.whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE]).first()
        if (+otherEstates.affected === 0) {
          subject = PUBLISH_ESTATE_EMAIL_SUBJECT
        }
        break

      case CONNECT_ESTATE:
        otherEstates = await estateQuery
          .innerJoin('estate_current_tenants', 'estate_current_tenants.estate_id', 'estates.id')
          .whereIn('estate_current_tenants.status', [STATUS_ACTIVE])
          .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])
          .first()
        if (+otherEstates.affected === 0) {
          subject = CONNECT_ESTATE_EMAIL_SUBJECT
        }
        break
    }
    if (isEmpty(subject)) {
      return
    }
    const landlord = await User.query().where('id', landlordId)
    estates = await Estate.query().whereIn('id', estateIds).fetch()
    estateContent = estates.toJSON().map((estate) => estate.address)
    textMessage = textMessage
      .replace('[SUBJECT]', subject)
      .replace('[ESTATES]', `\n${estateContent.join('\n')}`)
      .replace('[LANDLORD]', `${landlord.firstname} ${landlord.secondname}(${landlord.email})`)
    htmlMessage = htmlMessage
      .replace('[SUBJECT]', subject)
      .replace('[ESTATES]', `<li>${estateContent.join('</li><li>')}</li>`)
      .replace('[LANDLORD]', `${landlord.firstname} ${landlord.secondname}(${landlord.email})`)
    await MailService.sendEmailToSupport({ subject, textMessage, htmlMessage })
  }

  static async contactOhneMakler(thirdPartyOfferId, userId, message) {
    const estate = await ThirdPartyOffer.query().where('id', thirdPartyOfferId).first()
    const prospect = await User.query()
      .join('tenants', 'tenants.user_id', 'users.id')
      .where('users.id', userId)
      .first()
    const titleFromGender = (genderId) => {
      switch (genderId) {
        case GENDER_MALE:
          return l.get(SALUTATION_MR_LABEL, 'en')
        case GENDER_FEMALE:
          return l.get(SALUTATION_MS_LABEL, 'en')
        case GENDER_ANY:
          return l.get(SALUTATION_SIR_OR_MADAM_LABEL, 'en')
        case GENDER_NEUTRAL:
          return l.get(SALUTATION_NEUTRAL_LABEL, 'en')
      }
      return null
    }
    const obj = {
      openimmo_feedback: {
        object: {
          oobj_id: estate.source_id,
          prospect: {
            surname: titleFromGender(prospect.sex), //weird...
            first: prospect.firstname,
            last: prospect.secondname,
            street: '', //see address
            plz: '', //see address
            location: prospect.address,
            tel: prospect.phone,
            email: prospect.email,
            enquiry: message,
          },
        },
      },
    }
    const xmlmessage = toXML(obj)
    await MailService.sendEmailToOhneMakler(xmlmessage)
  }
}

module.exports = QueueJobService
