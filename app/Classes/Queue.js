const { Queue, QueueScheduler, Worker, Job, JobsOptions } = require('bullmq')

const defaultOptions = {
  removeOnComplete: true
}

const {
  SCHEDULED_EVERY_1M_JOB,
  SCHEDULED_EVERY_5M_JOB,
  SCHEDULED_EVERY_3RD_HOUR_23RD_MINUTE_JOB,
  SCHEDULED_FOR_EVERY_MINUTE_ENDING_IN_3_JOB,
  SCHEDULED_EVERY_37TH_MINUTE_HOURLY_JOB,
  SCHEDULED_13H_DAY_JOB,
  SCHEDULED_9H_DAY_JOB,
  SCHEDULED_FRIDAY_JOB,
  SCHEDULED_EVERY_15MINUTE_NIGHT_JOB,
  SCHEDULED_MONTHLY_AT_10TH_AND_AT_10AM,
  SCHEDULED_MONTHLY_AT_15TH_AND_AT_10AM
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
    const Logger = use('Logger')

    try {
      const QueueService = use('App/Services/QueueService')

      this.commonWorker = new Worker(
        COMMON_QUEUE,
        async (job) => {
          return QueueService.processJob(job)
        },
        { connection: this.connection, concurrency: 10 }
      )

      // reset list repeating jobs -- to clear old lingering repeating jobs
      const repeatingJobs = await this.commonQueue.getRepeatableJobs()
      for (const repeatingJob of repeatingJobs) {
        Logger.info(`[Queue] removing repeating job ${repeatingJob.key} `)
        await this.commonQueue.removeRepeatableByKey(repeatingJob.key)
      }

      // ---- init repeatable jobs
      // Run every 1 min
      this.commonQueue
        .add(
          SCHEDULED_EVERY_1M_JOB,
          {},
          { repeat: { cron: '*/1 * * * *' }, removeOnComplete: true, removeOnFail: true }
        )
        .catch(Logger.error)

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
              delay: 5000
            }
          }
        )
        .catch(Logger.error)

      this.commonQueue
        .add(
          SCHEDULED_FOR_EVERY_MINUTE_ENDING_IN_3_JOB,
          {},
          {
            repeat: { cron: '3,13,23,33,43,53 * * * *' },
            removeOnComplete: true,
            removeOnFail: true,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000
            }
          }
        )
        .catch(Logger.error)

      this.commonQueue
        .add(
          SCHEDULED_EVERY_37TH_MINUTE_HOURLY_JOB,
          {},
          {
            repeat: { cron: '37 */1 * * *' },
            removeOnComplete: true,
            removeOnFail: true,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000
            }
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

      this.commonQueue.add(
        SCHEDULED_MONTHLY_AT_10TH_AND_AT_10AM,
        {},
        { repeat: { cron: '0 10 10 * *' }, removeOnComplete: true, removeOnFail: true }
      )

      this.commonQueue.add(
        SCHEDULED_MONTHLY_AT_15TH_AND_AT_10AM,
        {},
        { repeat: { cron: '0 10 15 * *' }, removeOnComplete: true, removeOnFail: true }
      )

      this.commonQueue.add(
        SCHEDULED_EVERY_15MINUTE_NIGHT_JOB,
        {},
        {
          jobId: SCHEDULED_EVERY_15MINUTE_NIGHT_JOB,
          repeat: { cron: '*/15 * * * *' },
          removeOnComplete: true,
          removeOnFail: true
        }
      )

      // queue needs short break for processing otherwise the get Jobs
      // is missing the now new scheduled repeating jobs
      await new Promise((resolve) => setTimeout(resolve, 100))

      // log state of queue
      const allJobsAfterSetup = await this.commonQueue.getJobs()
      Logger.info(
        '[Queue] --- setup complete following job list --- \n' +
          allJobsAfterSetup.map((job) => `${job.name} - ${job.id}`).join(' \n')
      )
    } catch (e) {
      Logger.error(`QueueEngine init error ${e.message || e}`)
    }
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
