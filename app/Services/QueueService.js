const Queue = use('Queue')
const Logger = use('Logger')
const MemberService = use('App/Services/MemberService')
const QueueJobService = use('App/Services/QueueJobService')
const TenantService = use('App/Services/TenantService')
const ImageService = use('App/Services/ImageService')
const ImportService = use('App/Services/ImportService')
const TenantPremiumPlanService = use('App/Services/TenantPremiumPlanService')
const { isFunction } = require('lodash')

const GET_POINTS = 'getEstatePoint'
const GET_THIRD_PARTY_POINT = 'getThirdPartyPoint'
const GET_ISOLINE = 'getTenantIsoline'
const GET_COORDINATES = 'getEstateCoordinates'
const GET_THIRD_PARTY_COORDINATES = 'getThirdPartyCoordinates'
const SAVE_PROPERTY_IMAGES = 'savePropertyImages'
const UPLOAD_OPENIMMO_IMAGES = 'uploadOpenImmoImages'
const CONTACT_OHNE_MAKLER = 'contactOhneMakler'
const CONTACT_GEWOBAG = 'contactGewobag'
const CREATE_THUMBNAIL_IMAGES = 'createThumbnailImages'
const DEACTIVATE_LANDLORD = 'deactivateLandlord'
const GET_IP_BASED_INFO = 'getIpBasedInfo'
const IMPORT_ESTATES_VIA_EXCEL = 'importEstate'
const GET_TENANT_MATCH_PROPERTIES = 'getTenantMatchProperties'
const SEND_EMAIL_TO_SUPPORT_FOR_LANDLORD_UPDATE = 'sendEmailToSupportForLandlordUpdate'
const QUEUE_CREATE_THIRD_PARTY_MATCHES = 'createThirdPartyMatches'
const NOTIFY_PROSPECT_WHO_LIKED_BUT_NOT_KNOCKED = 'notifyProspectWhoLikedButNotKnocked'
const ESTATE_SYNC_PUBLISH_ESTATE = 'estateSyncPublishEstate'
const ESTATE_SYNC_PUBLISH_BUILDING = 'estateSyncPublishBuilding'
const ESTATE_SYNC_UNPUBLISH_ESTATES = 'estateSyncUnpublishEstates'
const KNOCK_SEND_REQUEST_EMAIL = 'knockRequestToEstate'
const {
  SCHEDULED_EVERY_15MINUTE_NIGHT_JOB,
  SCHEDULED_EVERY_1M_JOB,
  SCHEDULED_EVERY_5M_JOB,
  SCHEDULED_EVERY_3RD_HOUR_23RD_MINUTE_JOB,
  SCHEDULED_EVERY_37TH_MINUTE_HOURLY_JOB,
  SCHEDULED_13H_DAY_JOB,
  SCHEDULED_FRIDAY_JOB,
  SCHEDULED_9H_DAY_JOB,
  SCHEDULED_FOR_EVERY_MINUTE_ENDING_IN_3_JOB,
  QUEUE_JOB_URGENT,
  SCHEDULED_MONTHLY_AT_10TH_AND_AT_10AM,
  SCHEDULED_MONTHLY_AT_15TH_AND_AT_10AM
} = require('../constants')
const HttpException = require('../Exceptions/HttpException')

/**
 * Do not stop rest notifications on some error
 */
const wrapException = async (func, params = []) => {
  try {
    if (isFunction(func)) {
      return func(...params)
    }
  } catch (e) {
    Logger.error(e)
  }
}

/**
 *
 */
class QueueService {
  /**
   * Get estate nearest POI
   */
  static getEstatePoint(estateId) {
    Queue.addJob(GET_POINTS, { estateId }, { delay: 1 })
  }

  static getThirdPartyPoint(estateId) {
    Queue.addJob(GET_THIRD_PARTY_POINT, { estateId }, { delay: 1 })
  }

  static uploadOpenImmoImages(images, estateId) {
    Queue.addJob(UPLOAD_OPENIMMO_IMAGES, { images, estateId }, { delay: 1 })
  }

  static getAnchorIsoline(tenantId) {
    Queue.addJob(GET_ISOLINE, { tenantId }, { delay: 1 })
  }

  static sendEmailToSupportForLandlordUpdate({ type, landlordId, estateIds }) {
    Queue.addJob(
      SEND_EMAIL_TO_SUPPORT_FOR_LANDLORD_UPDATE,
      { type, landlordId, estateIds },
      { delay: 1 }
    )
  }

  static contactOhneMakler({ third_party_offer_id, userId, message }) {
    Queue.addJob(CONTACT_OHNE_MAKLER, { third_party_offer_id, userId, message }, { delay: 1 })
  }

  static contactGewobag({ third_party_offer_id, userId }) {
    Queue.addJob(CONTACT_GEWOBAG, { third_party_offer_id, userId }, { delay: 1 })
  }

  static importEstate({ s3_bucket_file_name, fileName, user_id, template, import_id, lang }) {
    Queue.addJob(
      IMPORT_ESTATES_VIA_EXCEL,
      { s3_bucket_file_name, fileName, user_id, template, import_id, lang },
      { delay: 1 }
    )
  }

  static estateSyncPublishEstate({ estate_id }) {
    Queue.addJob(ESTATE_SYNC_PUBLISH_ESTATE, { estate_id }, { delay: 400 })
  }

  static estateSyncPublishBuilding({ building_id, publisher }, userId) {
    console.log('esateSyncPublishBuilding called...', building_id, publisher, userId)
    Queue.addJob(ESTATE_SYNC_PUBLISH_BUILDING, { building_id, publisher, userId })
  }

  static estateSyncUnpublishEstates(estate_ids, markListingsForDelete = true) {
    Queue.addJob(ESTATE_SYNC_UNPUBLISH_ESTATES, { estate_ids, markListingsForDelete })
  }

  /**
   * Get estate coord by address then get nearest POI
   */
  static getEstateCoords(estateId) {
    Queue.addJob(GET_COORDINATES, { estateId }, { delay: 1 })
  }

  static getThirdPartyCoords(estateId) {
    Queue.addJob(GET_THIRD_PARTY_COORDINATES, { estateId }, { delay: 1 })
  }

  static savePropertyBulkImages(properyImages) {
    Queue.addJob(SAVE_PROPERTY_IMAGES, { properyImages }, { delay: 1 })
  }

  static creatThumbnail() {
    Queue.addJob(CREATE_THUMBNAIL_IMAGES, {}, { delay: 1 })
  }

  static deactivateLandlord(deactivationId, userId, delay) {
    Queue.addJob(DEACTIVATE_LANDLORD, { deactivationId, userId }, { delay })
  }

  static notifyProspectWhoLikedButNotKnocked(estateId, userId, delay) {
    Queue.addJob(NOTIFY_PROSPECT_WHO_LIKED_BUT_NOT_KNOCKED, { estateId, userId }, { delay })
  }

  static sendKnockRequestEmail({ link, contact, estate, landlord_name, lang }, delay) {
    Queue.addJob(
      KNOCK_SEND_REQUEST_EMAIL,
      { link, contact, estate, landlord_name, lang },
      { delay }
    )
  }

  static getIpBasedInfo(userId, ip) {
    Queue.addJob(GET_IP_BASED_INFO, { userId, ip }, { delay: 1 })
  }

  static async doEvery15MinsJob() {
    return Promise.all([
      wrapException(QueueJobService.updateThirdPartyOfferPoints),
      wrapException(QueueJobService.fillMissingEstateInfo),
      wrapException(require('./MatchService').sendKnockedReachedNotification)
    ])
  }

  static getTenantMatchProperties({ userId, only_count = false, has_notification_sent = false }) {
    Queue.addJob(
      GET_TENANT_MATCH_PROPERTIES,
      { userId, has_notification_sent, only_count },
      { priority: QUEUE_JOB_URGENT }
    )
  }

  static createThirdPartyMatchesByEstate() {
    try {
      Queue.addJob(
        QUEUE_CREATE_THIRD_PARTY_MATCHES,
        {},
        {
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 3,
          delay: 1,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        }
      )
    } catch (e) {
      Logger.error(`createThirdPartyMatchesByEstate error ${e.message || e}`)
    }
  }

  /**
   *
   */
  static async sendEveryMin() {
    return Promise.all([wrapException(require('./MatchService').moveExpiredFinalConfirmToTop)])
  }

  /**
   *
   */
  static async sendEvery5Min() {
    const NoticeService = require('./NoticeService')
    return Promise.all([
      wrapException(QueueJobService.handleToExpireEstates),
      // wrapException(QueueJobService.handleToActivateEstates),
      wrapException(QueueJobService.handleShowDateEndedEstates),
      wrapException(QueueJobService.handleShowDateWillEndInAnHourEstates),
      wrapException(NoticeService.landlordVisitIn90m),
      wrapException(NoticeService.prospectVisitIn90m),
      wrapException(NoticeService.landlordVisitIn30m),
      wrapException(NoticeService.prospectVisitIn30m),
      wrapException(NoticeService.getProspectVisitIn3H),
      wrapException(NoticeService.getProspectVisitIn48H),
      wrapException(NoticeService.expiredShowTime),
      wrapException(NoticeService.getProspectLandlordInvite),
      wrapException(QueueJobService.updatePOI)
    ])
  }

  /**
   *
   */
  static async performEvery3rdHour23rdMinuteJob() {
    const ThirdPartyOfferService = require('./ThirdPartyOfferService')
    return Promise.all([wrapException(ThirdPartyOfferService.pullOhneMakler)])
  }

  static async performEvery1HourJob() {
    return Promise.all([wrapException(require('./EstateService').updateVacantDate)])
  }

  static async pullGewobag() {
    const ThirdPartyOfferService = require('../Services/ThirdPartyOfferService')
    return Promise.all([wrapException(ThirdPartyOfferService.pullGewobag)])
  }

  static async sendEveryDayMidday() {
    const NoticeService = require('./NoticeService')
    return Promise.all([
      wrapException(NoticeService.sendLandlordNewProperty),
      wrapException(NoticeService.sandLandlord7DaysInactive),
      wrapException(NoticeService.sandProspectNoActivity),
      wrapException(TenantPremiumPlanService.validateAllSubscriptions)
    ])
  }

  /**
   *
   */
  static async sendFriday14H() {
    return Promise.all([wrapException(require('./NoticeService').sendProspectNewMatches)])
  }

  /**
   *
   */
  static async sendEveryDay9AM() {
    const NoticeService = require('./NoticeService')
    return Promise.all([
      wrapException(require('./NoticeService').prospectProfileExpiring),
      wrapException(QueueJobService.updateAllMisseEstateCoord),
      wrapException(QueueJobService.sendLikedNotificationBeforeExpired),
      wrapException(require('./MarketPlaceService').sendReminderEmail),
      wrapException(require('./TenantService').reminderProfileFillUp)
    ])
  }

  /**
   *
   */
  static async sendEveryMonth12AM() {
    // return Promise.all([wrapException(MemberService.handleOutdatedIncomeProofs)])
  }

  // no called from anywhere
  // static async addJobFetchPOI() {
  //   try {
  //     const job = await Queue.getJobById(SCHEDULED_EVERY_15MINUTE_NIGHT_JOB)
  //     job?.remove()
  //     await Queue.addJob(
  //       SCHEDULED_EVERY_15MINUTE_NIGHT_JOB,
  //       {},
  //       {
  //         jobId: SCHEDULED_EVERY_15MINUTE_NIGHT_JOB,
  //         repeat: { cron: '*/15 * * * *' },
  //         removeOnComplete: true,
  //         removeOnFail: true
  //       }
  //     )
  //   } catch (e) {
  //     Logger.error(`addJobFetchPOI error ${e.message || e}`)
  //   }
  // }

  // static async removeJobFetchPOI() {
  //   try {
  //     const job = await Queue?.getJobById(SCHEDULED_EVERY_15MINUTE_NIGHT_JOB)
  //     job?.remove()
  //   } catch (e) {
  //     Logger.error(`removeJobFetchPOI error ${e.message || e}`)
  //   }
  // }

  /**
   *
   */
  static async processJob(job) {
    try {
      switch (job.name) {
        case UPLOAD_OPENIMMO_IMAGES:
          return ImageService.uploadOpenImmoImages(job.data.images, job.data.estateId)
        case GET_POINTS:
          return QueueJobService.updateEstatePoint(job.data.estateId)
        case GET_THIRD_PARTY_POINT:
          return QueueJobService.updateThirdPartyPoint(job.data.estateId)
        case GET_COORDINATES:
          return QueueJobService.updateEstateCoord(job.data.estateId)
        case GET_THIRD_PARTY_COORDINATES:
          return QueueJobService.updateThirdPartyCoord(job.data.estateId)
        case GET_ISOLINE:
          return TenantService.updateTenantIsoline({ tenantId: job.data.tenantId })
        case CONTACT_OHNE_MAKLER:
          return QueueJobService.contactOhneMakler(
            job.data.third_party_offer_id,
            job.data.userId,
            job.data.message
          )
        case CONTACT_GEWOBAG:
          return QueueJobService.contactGewobag(job.data.third_party_offer_id, job.data.userId)
        case SEND_EMAIL_TO_SUPPORT_FOR_LANDLORD_UPDATE:
          return QueueJobService.sendEmailToSupportForLandlordUpdate({
            type: job.data.type,
            landlordId: job.data.landlordId,
            estateIds: job.data.estateIds
          })
        case IMPORT_ESTATES_VIA_EXCEL:
          return ImportService.process({
            s3_bucket_file_name: job.data.s3_bucket_file_name,
            filePath: job.data.fileName,
            user_id: job.data.user_id,
            type: job.data.template,
            import_id: job.data.import_id,
            lang: job.data.lang
          })
        case SCHEDULED_EVERY_15MINUTE_NIGHT_JOB:
          return QueueService.doEvery15MinsJob()
        case SCHEDULED_EVERY_1M_JOB:
          return QueueService.sendEveryMin()
        case SCHEDULED_EVERY_5M_JOB:
          return QueueService.sendEvery5Min()
        case SCHEDULED_EVERY_3RD_HOUR_23RD_MINUTE_JOB:
          return QueueService.performEvery3rdHour23rdMinuteJob()
        case SCHEDULED_EVERY_37TH_MINUTE_HOURLY_JOB:
          return QueueService.performEvery1HourJob()
        case SCHEDULED_FOR_EVERY_MINUTE_ENDING_IN_3_JOB:
          return QueueService.pullGewobag()
        case SCHEDULED_13H_DAY_JOB:
          return QueueService.sendEveryDayMidday()
        case SCHEDULED_FRIDAY_JOB:
          return QueueService.sendFriday14H()
        case SCHEDULED_9H_DAY_JOB:
          return QueueService.sendEveryDay9AM()
        case SAVE_PROPERTY_IMAGES:
          return ImageService.savePropertyBulkImages(job.data.properyImages)
        case CREATE_THUMBNAIL_IMAGES:
          return QueueJobService.createThumbnailImages()
        case DEACTIVATE_LANDLORD:
          return QueueJobService.deactivateLandlord(job.data.deactivationId, job.data.userId)
        case GET_IP_BASED_INFO:
          return QueueJobService.getIpBasedInfo(job.data.userId, job.data.ip)
        case GET_TENANT_MATCH_PROPERTIES:
          return require('./MatchService').matchByUser({
            userId: job.data.userId,
            has_notification_sent: job.data.has_notification_sent,
            only_count: job.data.only_count
          })
        case QUEUE_CREATE_THIRD_PARTY_MATCHES:
          return require('./ThirdPartyMatchService').matchByEstates()
        case NOTIFY_PROSPECT_WHO_LIKED_BUT_NOT_KNOCKED:
          return QueueJobService.notifyProspectWhoLikedButNotKnocked(
            job.data.estateId,
            job.data.userId
          )
        case ESTATE_SYNC_PUBLISH_ESTATE:
          return require('./EstateSyncService').postEstate({
            estate_id: job.data.estate_id
          })
        case ESTATE_SYNC_PUBLISH_BUILDING:
          console.log(ESTATE_SYNC_PUBLISH_BUILDING, job.data)
          return require('./EstateSyncService').publishBuilding(
            { buildingId: job.data.building_id, publisher: job.data.publisher },
            job.data.userId
          )
        case ESTATE_SYNC_UNPUBLISH_ESTATES:
          return require('./EstateSyncService').unpublishMultipleEstates(
            job.data.estate_ids,
            job.data.markListingsForDelete
          )
        case KNOCK_SEND_REQUEST_EMAIL:
          require('./MarketPlaceService').inviteProspect({
            link: job.data.link,
            contact: job.data.contact,
            estate: job.data.estate,
            landlord_name: job.data.landlord_name,
            lang: job.data.lang
          })
          break
        case SCHEDULED_MONTHLY_AT_10TH_AND_AT_10AM:
          require('./TenantService').scheduleProspectsForDeactivation()
          break
        case SCHEDULED_MONTHLY_AT_15TH_AND_AT_10AM:
          require('./TenantService').handleProspectsScheduledForDeactivation()
          break
        default:
          console.log(`No job processor for: ${job.name}`)
      }
    } catch (e) {
      Logger.error(e)
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = QueueService
