const { Queue, QueueScheduler, Worker, Job, JobsOptions } = require('bullmq')

const defaultOptions = {
  removeOnComplete: true,
}

const {
  SCHEDULED_EVERY_5M_JOB,
  SCHEDULED_13H_DAY_JOB,
  SCHEDULED_9H_DAY_JOB,
  SCHEDULED_FRIDAY_JOB,
  SCHEDULED_MONTHLY_JOB
} = require('../constants')
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
    const Logger = use('Logger')
    this.commonWorker = new Worker(
      COMMON_QUEUE,
      async (job) => {
        return QueueService.processJob(job)
      },
      { connection: this.connection, concurrency: 10 }
    )

    // Run every 5 min check for moving expire job
    this.commonQueue
      .add(SCHEDULED_EVERY_5M_JOB, {}, { repeat: { cron: '*/5 * * * *' }, removeOnComplete: true })
      .catch(Logger.error)

    this.commonQueue
      .add(SCHEDULED_13H_DAY_JOB, {}, { repeat: { cron: '15 13 * * *' }, removeOnComplete: true })
      .catch(Logger.error)

    this.commonQueue
      .add(SCHEDULED_FRIDAY_JOB, {}, { repeat: { cron: '10 14 * * 5' }, removeOnComplete: true })
      .catch(Logger.error)

    this.commonQueue
      .add(SCHEDULED_9H_DAY_JOB, {}, { repeat: { cron: '0 9 * * *' }, removeOnComplete: true })
      .catch(Logger.error)

    this.commonQueue
      .add(SCHEDULED_MONTHLY_JOB, {}, { repeat: { cron: '0 0 12 * * *' }, removeOnComplete: true })
      .catch(Logger.error)


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
