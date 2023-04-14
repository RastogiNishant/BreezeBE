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
const GET_ISOLINE = 'getTenantIsoline'
const GET_COORDINATES = 'getEstateCoordinates'
const SAVE_PROPERTY_IMAGES = 'savePropertyImages'
const UPLOAD_OPENIMMO_IMAGES = 'uploadOpenImmoImages'
const CONTACT_OHNE_MAKLER = 'contactOhneMakler'
const CREATE_THUMBNAIL_IMAGES = 'createThumbnailImages'
const DEACTIVATE_LANDLORD = 'deactivateLandlord'
const GET_IP_BASED_INFO = 'getIpBasedInfo'
const IMPORT_ESTATES_VIA_EXCEL = 'importEstate'
const GET_TENANT_MATCH_PROPERTIES = 'getTenantMatchProperties'
const SEND_EMAIL_TO_SUPPORT_FOR_LANDLORD_UPDATE = 'sendEmailToSupportForLandlordUpdate'
const QUEUE_CREATE_THIRD_PARTY_MATCHES = 'createThirdPartyMatches'
const {
  SCHEDULED_EVERY_10MINUTE_NIGHT_JOB,
  SCHEDULED_EVERY_5M_JOB,
  SCHEDULED_EVERY_3RD_HOUR_23RD_MINUTE_JOB,
  SCHEDULED_13H_DAY_JOB,
  SCHEDULED_FRIDAY_JOB,
  SCHEDULED_9H_DAY_JOB,
  SCHEDULED_MONTHLY_JOB,
} = require('../constants')

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

  static importEstate({ s3_bucket_file_name, fileName, user_id, template, import_id }) {
    Queue.addJob(
      IMPORT_ESTATES_VIA_EXCEL,
      { s3_bucket_file_name, fileName, user_id, template, import_id },
      { delay: 1 }
    )
  }

  /**
   * Get estate coord by address then get nearest POI
   */
  static getEstateCoords(estateId) {
    Queue.addJob(GET_COORDINATES, { estateId }, { delay: 1 })
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

  static getIpBasedInfo(userId, ip) {
    Queue.addJob(GET_IP_BASED_INFO, { userId, ip }, { delay: 1 })
  }

  static async doEvery10MinAtNight() {
    return Promise.all([wrapException(QueueJobService.updateThirdPartyOfferPoints)])
  }

  static getTenantMatchProperties({ userId, has_notification_sent = false }) {
    Queue.addJob(GET_TENANT_MATCH_PROPERTIES, { userId, has_notification_sent })
  }

  static createThirdPartyMatchesByEstate() {
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
          delay: 5000,
        },
      }
    )
  }

  /**
   *
   */
  static async sendEvery5Min() {
    const NoticeService = require('./NoticeService')
    return Promise.all([
      wrapException(QueueJobService.handleToExpireEstates),
      wrapException(QueueJobService.handleToActivateEstates),
      wrapException(QueueJobService.handleShowDateEndedEstates),
      wrapException(QueueJobService.handleShowDateWillEndInAnHourEstates),
      wrapException(NoticeService.landlordVisitIn90m),
      wrapException(NoticeService.prospectVisitIn90m),
      wrapException(NoticeService.landlordVisitIn30m),
      wrapException(NoticeService.prospectVisitIn30m),
      wrapException(NoticeService.getProspectVisitIn3H),
      wrapException(NoticeService.expiredShowTime),
      wrapException(QueueJobService.updatePOI),
    ])
  }

  /**
   *
   */
  static async performEvery3rdHour23rdMinuteJob() {
    const ThirdPartyOfferService = require('../Services/ThirdPartyOfferService')
    return Promise.all([wrapException(ThirdPartyOfferService.pullOhneMakler)])
  }

  static async sendEveryDayMidday() {
    return Promise.all([
      wrapException(NoticeService.sendLandlordNewProperty),
      wrapException(NoticeService.sandLandlord7DaysInactive),
      wrapException(NoticeService.sandProspectNoActivity),
      wrapException(TenantPremiumPlanService.validateAllSubscriptions),
    ])
  }

  /**
   *
   */
  static async sendFriday14H() {
    return Promise.all([wrapException(NoticeService.sendProspectNewMatches)])
  }

  /**
   *
   */
  static async sendEveryDay9AM() {
    return Promise.all([
      wrapException(NoticeService.prospectProfileExpiring),
      wrapException(QueueJobService.updateAllMisseEstateCoord),
    ])
  }

  /**
   *
   */
  static async sendEveryMonth12AM() {
    return Promise.all([wrapException(MemberService.handleOutdatedIncomeProofs)])
  }

  static async addJobFetchPOI() {
    const job = await Queue.getJobById(SCHEDULED_EVERY_10MINUTE_NIGHT_JOB)
    job?.remove()
    await Queue.addJob(
      SCHEDULED_EVERY_10MINUTE_NIGHT_JOB,
      {},
      {
        jobId: SCHEDULED_EVERY_10MINUTE_NIGHT_JOB,
        repeat: { cron: '*/2 * * * *' },
        removeOnComplete: true,
        removeOnFail: true,
      }
    )
  }

  static async removeJobFetchPOI() {
    const job = await Queue?.getJobById(SCHEDULED_EVERY_10MINUTE_NIGHT_JOB)
    job?.remove()
  }
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
        case GET_COORDINATES:
          return QueueJobService.updateEstateCoord(job.data.estateId)
        case GET_ISOLINE:
          return TenantService.updateTenantIsoline(job.data.tenantId)
        case CONTACT_OHNE_MAKLER:
          return QueueJobService.contactOhneMakler(
            job.data.third_party_offer_id,
            job.data.userId,
            job.data.message
          )
        case SEND_EMAIL_TO_SUPPORT_FOR_LANDLORD_UPDATE:
          return QueueJobService.sendEmailToSupportForLandlordUpdate({
            type: job.data.type,
            landlordId: job.data.landlordId,
            estateIds: job.data.estateIds,
          })
        case IMPORT_ESTATES_VIA_EXCEL:
          return ImportService.process({
            s3_bucket_file_name: job.data.s3_bucket_file_name,
            filePath: job.data.fileName,
            user_id: job.data.user_id,
            type: job.data.template,
            import_id: job.data.import_id,
          })
        case SCHEDULED_EVERY_10MINUTE_NIGHT_JOB:
          return QueueService.doEvery10MinAtNight()
        case SCHEDULED_EVERY_5M_JOB:
          return QueueService.sendEvery5Min()
        case SCHEDULED_EVERY_3RD_HOUR_23RD_MINUTE_JOB:
          return QueueService.performEvery3rdHour23rdMinuteJob()
        case SCHEDULED_13H_DAY_JOB:
          return QueueService.sendEveryDayMidday()
        case SCHEDULED_FRIDAY_JOB:
          return QueueService.sendFriday14H()
        case SCHEDULED_9H_DAY_JOB:
          return QueueService.sendEveryDay9AM()
        case SCHEDULED_MONTHLY_JOB:
          return QueueService.sendEveryMonth12AM()
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
          })
        case QUEUE_CREATE_THIRD_PARTY_MATCHES:
          return require('./ThirdPartyMatchService').matchByEstates()
        default:
          console.log(`No job processor for: ${job.name}`)
      }
    } catch (e) {
      Logger.error(e)
      throw e
    }
  }
}

module.exports = QueueService
