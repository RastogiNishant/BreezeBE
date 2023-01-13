const Queue = use('Queue')
const Logger = use('Logger')
const MemberService = use('App/Services/MemberService')
const NoticeService = use('App/Services/NoticeService')
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
const CREATE_THUMBNAIL_IMAGES = 'createThumbnailImages'
const DEACTIVATE_LANDLORD = 'deactivateLandlord'
const GET_IP_BASED_INFO = 'getIpBasedInfo'
const IMPORT_ESTATES_VIA_EXCEL = 'importEstate'
const {
  SCHEDULED_EVERY_5M_JOB,
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

  static getAnchorIsoline(tenantId) {
    Queue.addJob(GET_ISOLINE, { tenantId }, { delay: 1 })
  }

  static importEstate(fileName, user_id, template) {
    Queue.addJob(IMPORT_ESTATES_VIA_EXCEL, { fileName, user_id, template }, { delay: 1 })
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

  /**
   *
   */
  static async sendEvery5Min() {
    return Promise.all([
      wrapException(QueueJobService.handleExpiredEstates),
      wrapException(QueueJobService.handleShowDateEndedEstates),
      wrapException(QueueJobService.handleShowDateWillEndInAnHourEstates),
      wrapException(NoticeService.landlordVisitIn90m),
      wrapException(NoticeService.prospectVisitIn90m),
      wrapException(NoticeService.landlordVisitIn30m),
      wrapException(NoticeService.prospectVisitIn30m),
      wrapException(NoticeService.getProspectVisitIn3H),
      wrapException(NoticeService.expiredShowTime),
    ])
  }

  /**
   *
   */
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

  /**
   *
   */
  static async processJob(job) {
    try {
      switch (job.name) {
        case GET_POINTS:
          return QueueJobService.updateEstatePoint(job.data.estateId)
        case GET_COORDINATES:
          return QueueJobService.updateEstateCoord(job.data.estateId)
        case GET_ISOLINE:
          return TenantService.updateTenantIsoline(job.data.tenantId)
        case IMPORT_ESTATES_VIA_EXCEL:
          return ImportService.process(job.data.fileName, job.data.user_id, job.data.template)
        case SCHEDULED_EVERY_5M_JOB:
          return QueueService.sendEvery5Min()
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
