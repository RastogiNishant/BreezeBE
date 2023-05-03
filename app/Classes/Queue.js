const { Queue, QueueScheduler, Worker, Job, JobsOptions } = require('bullmq')

const defaultOptions = {
  removeOnComplete: true,
}

const {
  SCHEDULED_EVERY_5M_JOB,
  SCHEDULED_EVERY_3RD_HOUR_23RD_MINUTE_JOB,
  SCHEDULED_13H_DAY_JOB,
  SCHEDULED_9H_DAY_JOB,
  SCHEDULED_FRIDAY_JOB,
  SCHEDULED_MONTHLY_JOB,
  SCHEDULED_EVERY_10MINUTE_NIGHT_JOB,
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
      .add(
        SCHEDULED_EVERY_5M_JOB,
        {},
        { repeat: { cron: '*/5 * * * *' }, removeOnComplete: true, removeOnFail: true }
      )
      .catch(Logger.error)

    this.commonQueue
      .add(
        SCHEDULED_EVERY_3RD_HOUR_23RD_MINUTE_JOB,
        {},
        {
          repeat: { cron: '23 */1 * * *' },
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        }
      )
      .catch(Logger.error)

    this.commonQueue
      .add(
        SCHEDULED_13H_DAY_JOB,
        {},
        { repeat: { cron: '15 13 * * *' }, removeOnComplete: true, removeOnFail: true }
      )
      .catch(Logger.error)

    this.commonQueue
      .add(
        SCHEDULED_FRIDAY_JOB,
        {},
        { repeat: { cron: '10 14 * * 5' }, removeOnComplete: true, removeOnFail: true }
      )
      .catch(Logger.error)

    this.commonQueue
      .add(
        SCHEDULED_9H_DAY_JOB,
        {},
        { repeat: { cron: '0 9 * * *' }, removeOnComplete: true, removeOnFail: true }
      )
      .catch(Logger.error)

    this.commonQueue
      .add(
        SCHEDULED_MONTHLY_JOB,
        {},
        { repeat: { cron: '0 0 12 * * *' }, removeOnComplete: true, removeOnFail: true }
      )
      .catch(Logger.error)

    this.commonQueue.add(
      SCHEDULED_EVERY_10MINUTE_NIGHT_JOB,
      {},
      {
        jobId: SCHEDULED_EVERY_10MINUTE_NIGHT_JOB,
        repeat: { cron: '*/15 * * * *' },
        removeOnComplete: true,
        removeOnFail: true,
      }
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
  async getJobById(id) {
    return this.commonQueue.getJob(id)
  }
}

module.exports = QueueEngine
