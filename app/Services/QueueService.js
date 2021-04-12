const Queue = use('Queue')

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
    console.log('processJob: ', job.name)
  }
}

module.exports = QueueService
