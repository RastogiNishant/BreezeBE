'use strict'

const EstateReportAbuse = use('App/Models/EstateReportAbuse')
class EstateReportAbuseService {
  static async reportEstateAbuse(user_id, estate_id, abuse) {
    const data = {
      user_id: user_id,
      estate_id: estate_id,
      abuse: abuse,
    }
    return EstateReportAbuse.createItem({
      ...data,
    })
  }
}

module.exports = EstateReportAbuseService