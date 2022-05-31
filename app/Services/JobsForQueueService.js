const Database = use('Database')
const Estate = use('App/Models/Estate')
const GeoService = use('App/Services/Geoservice')
const NoticeService = use('App/Services/NoticeService')

class JobsForQueueService {
  static async updateEstateCoord(estateId) {
    const estate = await Estate.findOrFail(estateId)
    if (!estate.address) {
      throw new AppException('Estate address invalid')
    }

    const result = await GeoService.geeGeoCoordByAddress(estate.address)
    if (result) {
      await estate.updateItem({ coord: `${result.lat},${result.lon}` })
      await this.updateEstatePoint(estateId)
    }
  }

  static async moveJobsToExpire() {
    // Find jobs with expired date and status active
    const estateIds = (
      await Estate.query()
        .select('id')
        .where('status', STATUS_ACTIVE)
        .where('available_date', '<=', moment().format(DATE_FORMAT))
        // .limit(100)
        .fetch()
    ).rows.map((i) => i.id)

    if (isEmpty(estateIds)) {
      return false
    }

    const trx = await Database.beginTransaction()
    try {
      // Update job status
      await Estate.query()
        .update({ status: STATUS_EXPIRE })
        .whereIn('id', estateIds)
        .transacting(trx)

      // Remove estates from - matches / likes / dislikes
      await Database.table('matches')
        .where('status', MATCH_STATUS_NEW)
        .whereIn('estate_id', estateIds)
        .delete()
        .transacting(trx)

      await Database.table('likes').whereIn('estate_id', estateIds).delete().transacting(trx)
      await Database.table('dislikes').whereIn('estate_id', estateIds).delete().transacting(trx)

      await NoticeService.landLandlordEstateExpired(estateIds)
    } catch (e) {
      await trx.rollback()
      Logger.error(e)
      return false
    }

    await trx.commit()
  }

  static async updateEstatePoint(estateId) {
    const estate = await Estate.query().where('id', estateId).first()
    if (!estate) {
      throw new AppException(`Invalid estate ${estateId}`)
    }

    const { lat, lon } = estate.getLatLon()
    if (+lat === 0 && +lon === 0) {
      return false
    }
    const point = await GeoService.getOrCreatePoint({ lat, lon })
    estate.point_id = point.id

    return estate.save()
  }
}

module.exports = JobsForQueueService
