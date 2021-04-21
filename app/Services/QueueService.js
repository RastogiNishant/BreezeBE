const Queue = use('Queue')
const Logger = use('Logger')
const EstateService = use('App/Services/EstateService')

const GET_POINTS = 'getEstatePoint'
const GET_COORDINATES = 'getEstateCoordinates'

class QueueService {
  /**
   * Get estate nearest POI
   */
  static getEstatePoint(estateId) {
    Queue.addJob(GET_POINTS, { estateId }, { delay: 1 })
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
