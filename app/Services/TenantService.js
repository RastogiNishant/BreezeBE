'use strict'

const Database = use('Database')
const Member = use('App/Models/Member')
const Tenant = use('App/Models/Tenant')
const IncomeProof = use('App/Models/IncomeProof')
const File = use('App/Classes/File')
const AppException = use('App/Exceptions/AppException')
const GeoService = use('App/Services/GeoService')

const {
  MEMBER_FILE_TYPE_RENT,
  MEMBER_FILE_TYPE_DEBT,
  MEMBER_FILE_TYPE_INCOME,
} = require('../constants')

class TenantService {
  /**
   *
   */
  static getTenantQuery() {
    return Tenant.query().select('tenants.*', Database.gis.asGeoJSON('coord').as('coord'))
  }

  /**
   *
   */
  static async getProtectedFileLink(userId, fileId, fileType, memberId) {
    if (fileType === MEMBER_FILE_TYPE_INCOME) {
      const incomeProof = await IncomeProof.query()
        .select('income_proofs.*')
        .innerJoin({ _i: 'incomes' }, '_i.id', 'income_proofs.income_id')
        .innerJoin({ _m: 'members' }, '_m.id', '_i.member_id')
        .where('income_proofs.id', fileId)
        .where('_m.id', memberId)
        .where('_m.user_id', userId)
        .first()
      if (!incomeProof) {
        throw new AppException('File not exists')
      }

      return File.getProtectedUrl(incomeProof.file)
    } else {
      const member = await Member.query().where('id', memberId).where('user_id', userId).first()
      if (!member) {
        throw new AppException('File not exists')
      }
      if (fileType === MEMBER_FILE_TYPE_DEBT) {
        return member.debt_proof && File.getProtectedUrl(member.debt_proof)
      } else if (fileType === MEMBER_FILE_TYPE_RENT) {
        return member.rent_arrears_doc && File.getProtectedUrl(member.rent_arrears_doc)
      }
    }
  }

  /**
   *
   */
  static async updateTenantIsoline(tenantId) {
    const tenant = await TenantService.getTenantQuery().where({ id: tenantId }).first()
    const { lat, lon } = tenant.getLatLon()

    if (+lat === 0 || +lon === 0 || !tenant.dist_type || !tenant.dist_min) {
      // Invalid coordinates, nothing to parse
      return false
    }
    const point = await GeoService.getOrCreateIsoline(
      { lat, lon },
      tenant.dist_type,
      tenant.dist_min
    )
    tenant.point_id = point.id

    return tenant.save()
  }

  /**
   * Get Tenant with linked point
   */
  static async getTenantWithGeo(userId) {
    return Tenant.query()
      .select('tenants.*', '_p.zone as point_zone', '_p.lat AS point_lat', '_p.lon as point_lon')
      .leftJoin({ _p: 'points' }, '_p.id', 'tenants.point_id')
      .where({ 'tenants.user_id': userId })
      .first()
  }
}

module.exports = TenantService
