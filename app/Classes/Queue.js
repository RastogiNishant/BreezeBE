const { Queue, QueueScheduler, Worker, Job, JobsOptions } = require('bullmq')

const defaultOptions = {
  removeOnComplete: true,
}

const COMMON_QUEUE = 'common'

class QueueEngine {
  constructor(config) {
    this.connection = config
    this.queueScheduler = new QueueScheduler(COMMON_QUEUE, { connection: config })
    this.commonQueue = new Queue(COMMON_QUEUE, { connection: config })
  }

  /**
   *
   */
  async init() {
    // TODO: add scheduled jobs here
    console.log('Init queue')
    const QueueService = use('App/Services/QueueService')
    this.commonWorker = new Worker(
      COMMON_QUEUE,
      async (job) => {
        return QueueService.processJob(job)
      },
      { connection: this.connection, concurrency: 10 }
    )
  }

  /**
   *
   */
  async disconnect() {
    return this.queueScheduler.disconnect()
  }

  /**
   *
   */
  async addJob(name, data, options = {}) {
    return this.commonQueue.add(name, data, Object.assign(defaultOptions, options))
  }
}

module.exports = QueueEngine
