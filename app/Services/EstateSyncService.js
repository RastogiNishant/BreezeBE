'use_strict'

class EstateSyncService {
  static async publishEstate({ estate_id, estate_sync_property_id, publishers }) {
    const publisher = publishers.pop()

    if (publishers.length > 0) {
      return require('./QueueService').estateSyncPublishEstate({ estate_id, publishers })
    }
  }
}

module.exports = EstateSyncService
