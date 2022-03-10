const Queue = use('Queue')
const Logger = use('Logger')
const NoticeService = use('App/Services/NoticeService')
const EstateService = use('App/Services/EstateService')
const TenantService = use('App/Services/TenantService')
const ImageService = use('App/Services/ImageService')
const TenantPremiumPlanService = use('App/Services/TenantPremiumPlanService')

const GET_POINTS = 'getEstatePoint'
const GET_ISOLINE = 'getTenantIsoline'
const GET_COORDINATES = 'getEstateCoordinates'
const SAVE_PROPERTY_IMAGES = 'savePropertyImages'

const {
  SCHEDULED_EVERY_5M_JOB,
  SCHEDULED_13H_DAY_JOB,
  SCHEDULED_FRIDAY_JOB,
  SCHEDULED_9H_DAY_JOB,
} = require('../constants')

/**
 * Do not stop rest notifications on some error
 */
const wrapException = async (func, params = []) => {
  try {
    return func(...params)
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

  /**
   * Get estate coord by address then get nearest POI
   */
  static getEstateCoords(estateId) {
    Queue.addJob(GET_COORDINATES, { estateId }, { delay: 1 })
  }

  static savePropertyBulkImages(properyImages) {
    Queue.addJob(SAVE_PROPERTY_IMAGES, { properyImages }, { delay: 1 })
  }

  /**
   *
   */
  static async sendEvery5Min() {
    return Promise.all([
      wrapException(EstateService.moveJobsToExpire),
      wrapException(NoticeService.landlordVisitIn90m),
      wrapException(NoticeService.prospectVisitIn90m),
      wrapException(NoticeService.getNewWeekMatches),
      wrapException(NoticeService.landlordVisitIn30m),
      wrapException(NoticeService.prospectVisitIn30m),
      wrapException(NoticeService.getProspectVisitIn3H),
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
      wrapException(TenantPremiumPlanService.validateAllSubscriptions())
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
    return Promise.all([wrapException(NoticeService.prospectProfileExpiring)])
  }

  /**
   *
   */
  static async processJob(job) {
    try {
      switch (job.name) {
        case GET_POINTS:
          return EstateService.updateEstatePoint(job.data.estateId)
        case GET_COORDINATES:
          return EstateService.updateEstateCoord(job.data.estateId)
        case GET_ISOLINE:
          return TenantService.updateTenantIsoline(job.data.tenantId)
        case SCHEDULED_EVERY_5M_JOB:
          return QueueService.sendEvery5Min()
        case SCHEDULED_13H_DAY_JOB:
          return QueueService.sendEveryDayMidday()
        case SCHEDULED_FRIDAY_JOB:
          return QueueService.sendFriday14H()
        case SCHEDULED_9H_DAY_JOB:
          return QueueService.sendEveryDay9AM()
        case SAVE_PROPERTY_IMAGES:
          return ImageService.savePropertyBulkImages(job.data.properyImages)
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
