'use strict'

const TenantReportAbuse = use('App/Models/TenantReportAbuse')
class TenantReportAbuseService {
  static async reportTenantAbuse(params) {
    return TenantReportAbuse.createItem({
      ...params,
    })
  }

  static async deleteTenantAbuse(id) {
    TenantReportAbuse.query().where('id', id).delete()
  }
}

module.exports = TenantReportAbuseService