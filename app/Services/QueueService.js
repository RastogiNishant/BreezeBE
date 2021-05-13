const Queue = use('Queue')
const Logger = use('Logger')
const EstateService = use('App/Services/EstateService')
const TenantService = use('App/Services/TenantService')

const GET_POINTS = 'getEstatePoint'
const GET_ISOLINE = 'getTenantIsoline'
const GET_COORDINATES = 'getEstateCoordinates'

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
