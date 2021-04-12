'use strict'

const QueueListener = (exports = module.exports = {})
const QueueService = use('App/Services/QueueService')

QueueListener.processJob = async (job) => {
  switch (job.name) {
    // TODO: process jobs by name
    case '':
    default:
      await QueueService.processJob(job)
  }
}
