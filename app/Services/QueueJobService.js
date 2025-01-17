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
const Point = use('App/Models/Point')
const EstateSyncListing = use('App/Models/EstateSyncListing')
const { createDynamicLink } = require('../Libs/utils')
const randomstring = require('randomstring')

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
  MAXIMUM_EXPIRE_PERIOD,
  LETTING_TYPE_LET,
  POINT_TYPE_POI,
  SEND_EMAIL_TO_OHNEMAKLER_CONTENT,
  GEWOBAG_CONTACT_REQUEST_SENDER_EMAIL,
  SEND_EMAIL_TO_OHNEMAKLER_SUBJECT,
  GERMAN_DATE_TIME_FORMAT,
  GERMAN_DATE_FORMAT,
  GEWOBAG_EMAIL_CONTENT,
  SEND_EMAIL_TO_WOHNUNGSHELDEN_SUBJECT,
  GEWOBAG_CONTACT_REQUEST_RECIPIENT_EMAIL,
  PUBLISH_STATUS_INIT,
  PUBLISH_STATUS_APPROVED_BY_ADMIN,
  PUBLISH_STATUS_DECLINED_BY_ADMIN
} = require('../constants')
const Promise = require('bluebird')
const UserDeactivationSchedule = use('App/Models/UserDeactivationSchedule')
const MailService = use('App/Services/MailService')
const ImageService = use('App/Services/ImageService')
const MemberService = use('App/Services/MemberService')
const User = use('App/Models/User')
const Dislike = use('App/Models/Dislike')

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

  static async updateThirdPartyPoint(estateId) {
    const estate = await ThirdPartyOffer.query().where('id', estateId).first()
    const [lat, lon] = estate.coord_raw.split(/,/)
    if (+lat === 0 && +lon === 0) {
      return false
    }
    const point = await GeoService.getOrCreatePoint({ lat, lon })
    estate.point_id = point.id
    return estate.save()
  }

  static async updatePOI() {
    try {
      const points = (
        await Point.query()
          .where('type', POINT_TYPE_POI)
          .where(Database.raw(`points."data"->'data' is null `))
          .limit(3)
          .fetch()
      ).rows

      let i = 0
      while (i < points.length) {
        await GeoService.fillPoi(points[i])
        i++
      }
    } catch (e) {
      console.log('updatePoi error', e.message)
    }
  }

  static async updateEstateCoord(estateId) {
    const estate = await Estate.find(estateId)

    if (!estate || !estate.address || trim(estate.address) === '') {
      return
    }
    const oldCoord = estate.coord

    const result = await GeoService.geeGeoCoordByAddress(estate.address)
    if (result && result.lat && result.lon && !isNaN(result.lat) && !isNaN(result.lon)) {
      const coord = `${result.lat},${result.lon}`
      await estate.updateItem({ coord })
      await QueueJobService.updateEstatePoint(estateId)
      if (oldCoord) {
        return
      }
      require('./EstateService').emitValidAddress({
        user_id: estate.user_id,
        id: estate.id,
        coord,
        address: estate.address
      })
    } else {
      if (!oldCoord) {
        return
      }
      require('./EstateService').emitValidAddress({
        user_id: estate.user_id,
        id: estate.id,
        coord: null,
        address: estate.address
      })
    }
  }

  static async updateThirdPartyCoord(estateId) {
    const estate = await ThirdPartyOffer.query().where('id', estateId).first()
    const result = await GeoService.geeGeoCoordByAddress(estate.address)
    if (result && result.lat && result.lon && !isNaN(result.lat) && !isNaN(result.lon)) {
      const coord = `${result.lat},${result.lon}`
      await estate.updateItem({ coord })

      await QueueJobService.updateThirdPartyPoint(estateId)
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

    await Promise.map(
      estates,
      async (estate) => {
        await QueueJobService.updateEstateCoord(estate.id)
      },
      { concurrency: 1 }
    )
  }

  static async sendLikedNotificationBeforeExpired() {
    const estates = await require('./EstateService').getLikedButNotKnockedExpiringEstates()
    await require('./NoticeService').likedButNotKnockedToProspect(estates)
  }

  /** we don't need this one, because all activation will be done by Breeze admin */
  static async handleToActivateEstates() {
    try {
      const estates = (await QueueJobService.fetchToActivateEstates()).rows
      if (!estates || !estates.length) {
        return false
      }

      let i = 0
      while (i < estates.length) {
        await require('./EstateService').publishEstate({
          estate: estates[i],
          performed_by: estates[i].user_id,
          is_queue: true
        })
        i++
      }
    } catch (e) {
      Logger.error(`handleToActivateEstates error ${e.message}`)
    }
  }

  // Finds and handles the estates that available date is over
  static async handleToExpireEstates() {
    const estates = (await QueueJobService.fetchToExpireEstates()).rows.map((i) => {
      return {
        id: i.id,
        available_start_at: i.available_start_at
      }
    })
    if (isEmpty(estates)) {
      return false
    }

    const estateIdsToExpire = estates
      .filter((estate) => estate.available_start_at)
      .map((estate) => estate.id)
    const estateIdsToDraft = estates
      .filter(
        (estate) =>
          !estate.available_start_at ||
          estate.publish_status === PUBLISH_STATUS_INIT ||
          estate.publish_status === PUBLISH_STATUS_DECLINED_BY_ADMIN
      )
      .map((estate) => estate.id)

    const trx = await Database.beginTransaction()
    try {
      if (estateIdsToExpire && estateIdsToExpire.length) {
        await Estate.query()
          .update({ status: STATUS_EXPIRE })
          .whereIn('id', estateIdsToExpire)
          .transacting(trx)
      }

      if (estateIdsToDraft && estateIdsToDraft.length) {
        await Estate.query()
          .update({ status: STATUS_DRAFT, publish_status: PUBLISH_STATUS_INIT })
          .whereIn('id', estateIdsToDraft)
          .transacting(trx)
      }

      if (
        (estateIdsToExpire && estateIdsToExpire.length) ||
        (estateIdsToDraft && estateIdsToDraft.length)
      ) {
        // Delete new matches
        let estateIds = (estateIdsToExpire || []).concat(estateIdsToDraft || [])
        await Match.query()
          .whereIn('estate_id', estateIds)
          .where('status', MATCH_STATUS_NEW)
          .delete()
          .transacting(trx)

        estateIds = estateIdsToDraft || []
        if (estateIds?.length) {
          // will cause circular dependency if we're not using require...
          require('./QueueService').estateSyncUnpublishEstates(estateIds, true)
        }
      }

      await trx.commit()

      if (estateIdsToExpire && estateIdsToExpire.length) {
        NoticeService.landlordEstateExpired(estateIdsToExpire)
      }
    } catch (e) {
      await trx.rollback()
      Logger.error(e)
      return false
    }
  }

  static async fetchToActivateEstates() {
    return await Estate.query()
      .select('*')
      .with('estateSyncListings')
      .where('status', STATUS_DRAFT)
      .whereNot('letting_type', LETTING_TYPE_LET)
      .whereNotNull('available_start_at')
      .where('available_start_at', '<', moment.utc(new Date()).format(DATE_FORMAT))
      .where(function () {
        this.orWhere(function () {
          this.whereNotNull('available_end_at')
          this.where('available_end_at', '>', moment.utc(new Date()).format(DATE_FORMAT))
        })
        this.orWhere(function () {
          this.whereNull('available_end_at')
          this.where(
            Database.raw`DATE_PART('days', (now() - available_start_at))`,
            '<',
            MAXIMUM_EXPIRE_PERIOD
          )
        })
      })

      .fetch()
  }

  static async fetchToExpireEstates() {
    return Estate.query()
      .select('id')
      .where('status', STATUS_ACTIVE)
      .where(function () {
        this.orWhereNull('available_start_at')
        this.orWhere(function () {
          this.whereNotNull('available_end_at')
          this.where('available_end_at', '<=', moment.utc(new Date()).format(DATE_FORMAT))
        })
        this.orWhere(function () {
          this.whereNull('available_end_at')
          this.where(
            Database.raw`DATE_PART('days', (now() - available_start_at))`,
            '>=',
            MAXIMUM_EXPIRE_PERIOD
          )
        })
      })
      .fetch()
  }

  // Finds and handles the estates that show date is over between now and 5 minutes before
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
    const start = moment.utc().startOf('minute').subtract(5, 'minutes')
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
            activation_status: USER_ACTIVATION_STATUS_DEACTIVATED
          },
          trx
        )

        await Estate.query()
          .where('user_id', userId)
          .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
          .update({ status: STATUS_DRAFT, publish_status: PUBLISH_STATUS_INIT }, trx)

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
          // this is the first one(s)... we need to notify support
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
            surname: titleFromGender(prospect.sex), // weird...
            first: prospect.firstname,
            last: prospect.secondname,
            street: estate.street,
            plz: estate.zip,
            location: estate.city,
            tel: prospect.phone,
            email: prospect.email,
            enquiry: message
          }
        }
      }
    }
    const xmlmessage = toXML(obj)
    let recipient = ``
    if (process.env.NODE_ENV === 'production' && !process.env.TEST_OHNE_MAKLER_RECIPIENT_EMAIL) {
      // if production
      recipient = prospect.contact.email
    } else {
      recipient = process.env.TEST_OHNE_MAKLER_RECIPIENT_EMAIL
    }
    MailService.sendEmailToOhneMakler(
      xmlmessage,
      recipient,
      process.env.BREEZE_OHNE_MAKLER_RECIPIENT_EMAIL || false
    )
  }

  static async contactGewobag(third_party_offer_id, userId) {
    const estate = await ThirdPartyOffer.query().where('id', third_party_offer_id).first()
    const prospect = await User.query()
      .join('tenants', 'tenants.user_id', 'users.id')
      .where('users.id', userId)
      .first()
    if (!estate || !prospect) {
      return
    }
    const titleFromGender = (genderId) => {
      switch (genderId) {
        case GENDER_MALE:
          return l.get(SALUTATION_MR_LABEL, 'de')
        case GENDER_FEMALE:
          return l.get(SALUTATION_MS_LABEL, 'de')
        case GENDER_ANY:
          return l.get(SALUTATION_SIR_OR_MADAM_LABEL, 'de')
        case GENDER_NEUTRAL:
          return l.get(SALUTATION_NEUTRAL_LABEL, 'de')
      }
      return null
    }
    const deepLink = await createDynamicLink(
      `${process.env.DEEP_LINK}/?type=THIRD_PARTY_KNOCKED&email=${prospect.email}&user_id=${userId}&estate_id=${third_party_offer_id}`
    )
    const object = {
      openimmo_feedback: {
        version: '1.2.5',
        sender: {
          name: 'Breeze Venture GmbH',
          openimo_anid: '',
          email_zentrale: 'anfragen@gewobag.interessentenanfragen.de',
          email_direct: 'anfragen@gewobag.interessentenanfragen.de',
          datum: moment(new Date()).format(GERMAN_DATE_FORMAT),
          makler_id: '',
          regi_id: ''
        },
        objekt: {
          portal_obj_id: estate.id,
          oobj_id: estate.property_id,
          expose_url: deepLink,
          vermarktungsart: 'Miete', // temporary for demo purpose. this is marketing type
          strasse: `${estate.street} ${estate.house_number}`,
          ort: `${estate.zip} ${estate.city}`,
          interessent: {
            anrede: titleFromGender(prospect.sex),
            vorname: prospect.firstname,
            nachname: prospect.secondname,
            strasse: '',
            plz: '',
            ort: '',
            tel: prospect.phone,
            email: prospect.email,
            anfrage: GEWOBAG_EMAIL_CONTENT
          }
        }
      }
    }
    try {
      const xmlOptions = {
        header: true,
        indent: '  '
      }
      const attachment = Buffer.from(toXML(object, xmlOptions))
      const recipient =
        process.env.NODE_ENV === 'production'
          ? GEWOBAG_CONTACT_REQUEST_RECIPIENT_EMAIL
          : process.env.GEWOBAG_CONTACT_EMAIL

      MailService.sendEmailWithAttachment({
        textMessage: GEWOBAG_EMAIL_CONTENT,
        recipient,
        bcc:
          recipient === process.env.GEWOBAG_CONTACT_EMAIL
            ? null
            : process.env.GEWOBAG_CONTACT_EMAIL,
        subject:
          SEND_EMAIL_TO_WOHNUNGSHELDEN_SUBJECT +
          moment(new Date()).utcOffset(2).format(GERMAN_DATE_TIME_FORMAT),
        attachment: attachment.toString('base64'),
        from: GEWOBAG_CONTACT_REQUEST_SENDER_EMAIL
      })
    } catch (err) {
      console.log(err.message)
    }
  }

  static async fillMissingEstateInfo() {
    try {
      const estates = (
        await Estate.query()
          .whereNot('status', STATUS_DELETE)
          .where(function () {
            this.orWhereNull('share_link')
            this.orWhereNull('hash')
          })
          .limit(3)
          .fetch()
      ).toJSON()

      await Promise.map(
        estates,
        async (estate) => {
          await Estate.updateHashInfo(estate.id)
        },
        { concurrency: 1 }
      )
    } catch (e) {
      Logger.error(`fillMissingEstateInfo error ${e.message}`)
    }
  }

  static async updateThirdPartyOfferPoints() {
    if (
      process.env.PULL_OHNE_MAKLER_POI === undefined ||
      (process.env.PULL_OHNE_MAKLER_POI !== undefined && !+process.env.PULL_OHNE_MAKLER_POI)
    ) {
      return
    }
    const estates = (
      await ThirdPartyOffer.query()
        .select('id', 'coord_raw')
        .whereNull('point_id')
        .limit(10)
        .fetch()
    ).toJSON()

    let i = 0
    while (i < estates.length) {
      const estate = estates[i]
      try {
        if (estate.coord && estate.coord.match(/,/)) {
          const [lat, lon] = estate.coord.split(',')
          const point = await GeoService.getOrCreatePoint({ lat, lon })
          await ThirdPartyOffer.query().where('id', estate.id).update({ point_id: point.id })
        }
      } catch (e) {
        console.log('Fetching point error', e.message)
      }
      i++
    }
  }

  static async notifyProspectWhoLikedButNotKnocked(estateId, userId) {
    const estate = await require('./EstateService').getActiveById(estateId)

    if (!estate) {
      return
    }

    const stillLikes = await Database.select('*')
      .from('likes')
      .where('user_id', userId)
      .where('estate_id', estateId)

    const userStillLikes = stillLikes.length > 0
    if (!userStillLikes) {
      return
    }

    const knocked = await require('./MatchService').hasInteracted({ userId, estateId })
    if (!knocked) {
      // @TODO @FIXME undefined was estateIsStillPublished
      await NoticeService.notifyProspectWhoLikedButNotKnocked(undefined, userId)
    }
  }
}

module.exports = QueueJobService
