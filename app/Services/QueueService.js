const Queue = use('Queue')
const Logger = use('Logger')
const EstateService = use('App/Services/EstateService')

const GET_POINTS = 'getEstatePoint'

class QueueService {
  /**
   *
   */
  static getEstatePoint(estateId) {
    Queue.addJob(GET_POINTS, { estateId }, { delay: 1 })
  }

  /**
   *
   */
  static async processJob(job) {
    try {
      switch (job.name) {
        case GET_POINTS:
          const { estateId } = job.data
          return EstateService.updateEstateCoords(estateId)
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
