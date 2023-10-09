'use strict'

const moment = require('moment')
const yup = require('yup')
const { isEmpty } = require('lodash')
const Logger = use('Logger')

const Database = use('Database')
const Member = use('App/Models/Member')
const MemberFile = use('App/Models/MemberFile')
const Tenant = use('App/Models/Tenant')
const Point = use('App/Models/Point')
const IncomeProof = use('App/Models/IncomeProof')
const File = use('App/Classes/File')
const AppException = use('App/Exceptions/AppException')
const GeoService = use('App/Services/GeoService')
const MemberService = use('App/Services/MemberService')
const Promise = require('bluebird')
const {
  MEMBER_FILE_TYPE_RENT,
  MEMBER_FILE_TYPE_DEBT,
  MEMBER_FILE_TYPE_INCOME,
  MEMBER_FILE_TYPE_PASSPORT,

  PETS_SMALL,
  PETS_NO,

  INCOME_TYPE_EMPLOYEE,

  INCOME_TYPE_SELF_EMPLOYED,
  INCOME_TYPE_UNEMPLOYED,

  STATUS_ACTIVE,
  STATUS_DRAFT,
  MATCH_STATUS_NEW,
  ERROR_USER_INCOME_EXPIRE,
  NO_UNPAID_RENTAL,
  YES_UNPAID_RENTAL,
  NO_ANSWER_UNPAID_RENTAL,
  NO_INSOLVENCY,
  YES_INSOLVENCY,
  NO_ANSWER_INSOLVENCY,
  NO_CLEAN_PROCEDURE,
  YES_CLEAN_PROCEDURE,
  NO_ANSWER_CLEAN_PROCEDURE,
  NO_INCOME_SEIZURE,
  YES_INCOME_SEIZURE,
  NO_ANSWER_INCOME_SEIZURE,
  INCOME_TYPE_WORKER,
  INCOME_TYPE_CIVIL_SERVANT,
  INCOME_TYPE_FREELANCER,
  INCOME_TYPE_HOUSE_WORK,
  INCOME_TYPE_PENSIONER,
  INCOME_TYPE_TRAINEE,
  MEMBER_FILE_TYPE_EXTRA_RENT,
  MEMBER_FILE_TYPE_EXTRA_DEBT,
  MEMBER_FILE_TYPE_EXTRA_PASSPORT,
  TRANSPORT_TYPE_CAR,
  VALID_INCOME_PROOFS_PERIOD,
  NOTICE_TYPE_TENANT_PROFILE_FILL_UP_ID,
  MATCH_STATUS_KNOCK,
  DATE_FORMAT,
  STATUS_EXPIRE,
  INCOME_TYPE_OTHER_BENEFIT,
  INCOME_TYPE_CHILD_BENEFIT,
  HIRING_TYPE_FULL_TIME,
  DAY_FORMAT,
} = require('../constants')
const { getOrCreateTenant } = require('./UserService')
const HttpException = require('../Exceptions/HttpException')

const {
  exceptions: { USER_NOT_FOUND },
} = require('../exceptions')
const BaseService = require('./BaseService')
class TenantService extends BaseService {
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
    if (
      [
        MEMBER_FILE_TYPE_PASSPORT,
        MEMBER_FILE_TYPE_EXTRA_RENT,
        MEMBER_FILE_TYPE_EXTRA_DEBT,
        MEMBER_FILE_TYPE_EXTRA_PASSPORT,
      ].includes(fileType)
    ) {
      const passport = await MemberFile.query()
        .where('member_id', memberId)
        .where('id', fileId)
        .where('type', fileType)
        .where('status', STATUS_ACTIVE)
        .first()
      if (!passport) {
        throw new AppException('File not exists')
      }
      return File.getProtectedUrl(passport.file)
    } else if (fileType === MEMBER_FILE_TYPE_INCOME) {
      const incomeProof = await IncomeProof.query()
        .select('income_proofs.*')
        .innerJoin({ _i: 'incomes' }, function () {
          this.on('_i.id', 'income_proofs.income_id').on('_i.status', STATUS_ACTIVE)
        })
        .innerJoin({ _m: 'members' }, '_m.id', '_i.member_id')
        .where('income_proofs.id', fileId)
        .where('income_proofs.status', STATUS_ACTIVE)
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
  static async updateTenantIsoline({ tenantId, tenant }, trx = null) {
    tenant = tenant ?? (await TenantService.getTenantQuery().where({ id: tenantId }).first())
    if (!tenant) {
      throw new HttpException(USER_NOT_FOUND, 400)
    }

    const { lat, lon } = tenant.getLatLon()

    tenant.dist_type = tenant.dist_type || TRANSPORT_TYPE_CAR
    tenant.dist_min = tenant.dist_min || 60

    if (lat === undefined && lat === null && lon === undefined && lon === null) {
      // Invalid coordinates, nothing to parse
      return false
    }
    const point = await GeoService.getOrCreateIsoline(
      { lat, lon },
      tenant.dist_type,
      tenant.dist_min
    )
    tenant.point_id = point.id

    if (trx) return await tenant.save(trx)
    return await tenant.save()
  }

  static async getTenant(userId) {
    return Tenant.query().where('user_id', userId).first()
  }

  static async getTenantWithCertificates(userId) {
    let tenantWithCertificate = await Tenant.query()
      .select('*')
      .select('_tc.wbs_certificate')
      .leftJoin(
        Database.raw(`
    (select
      user_id as cert_user_id,
      array_agg(json_build_object(
        'city_id', city_id,
        'city', cities.city,
        'attachments', attachments,           
        'expiration_date', to_char(
          tenant_certificates.expired_at, '${DAY_FORMAT}'
        ),
        'expiration_status',
          case when tenant_certificates.expired_at < NOW() then
            'expired' else 'active' end,              
        'income_level', income_level))
      as wbs_certificate
      from tenant_certificates
      left join
        cities
      on tenant_certificates.city_id=cities.id
      where status=${STATUS_ACTIVE}
      group by user_id
      ) as _tc
    `),
        '_tc.cert_user_id',
        'tenants.user_id'
      )
      .where('tenants.user_id', userId)
      .first()

    const wbs_certificate = await Promise.map(
      tenantWithCertificate?.wbs_certificate || [],
      async (cert) => await this.getWithAbsoluteUrl(cert)
    )

    if (tenantWithCertificate) {
      tenantWithCertificate.wbs_certificate = wbs_certificate
    }

    return tenantWithCertificate
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

  /**
   *
   */
  static async getTenantValidProofsCount(userId, startOf) {
    if (!startOf) {
      startOf = moment()
        .utc()
        .subtract(VALID_INCOME_PROOFS_PERIOD, 'month')
        .startOf('month')
        .format('YYYY-MM-DD')
    }

    return Database.table({ _m: 'members' })
      .select(Database.raw(`COUNT(_ip.id) as income_proofs_count`))
      .select('_m.credit_score_not_applicable')
      .select('_i.income_type')
      .leftJoin({ _i: 'incomes' }, function () {
        this.on('_i.member_id', '_m.id').on('_i.status', STATUS_ACTIVE)
      })
      .leftJoin({ _ip: 'income_proofs' }, function () {
        this.on('_ip.income_id', '_i.id').on('_ip.status', STATUS_ACTIVE)
      })
      .where('_m.user_id', userId)
      .whereNot('_m.child', true)
      .where(function () {
        this.orWhere('_ip.expire_date', '>=', startOf)
        this.orWhereNull('_ip.expire_date')
      })
      .groupBy(['_m.id', '_ip.income_id', '_i.income_type'])
  }

  /**
   *
   */
  static async activateTenant(tenant, trx) {
    const getRequiredTenantData = (tenantId) => {
      return Database.table({ _t: 'tenants' })
        .select(
          '_t.private_use',
          '_t.pets',
          '_m.*',
          '_i.position',
          '_i.company',
          '_i.income_type',
          '_i.hiring_date',
          '_i.income',
          '_i.employment_type',
          '_i.income_contract_end',
          '_i.is_earlier_employeed',
          '_i.employeed_address',
          '_i.employeer_phone_number',
          '_i.probation_period'
        )
        .leftJoin({ _m: 'members' }, function () {
          this.on('_m.user_id', '_t.user_id').on(Database.raw(`"_m"."child" not in ( true )`))
        })
        .leftJoin({ _i: 'incomes' }, function () {
          this.on('_i.member_id', '_m.id').on('_i.status', STATUS_ACTIVE)
        })
        .where('_t.id', tenantId)
    }
    console.log('getRequiredTenantData=')
    const data = await getRequiredTenantData(tenant.id)
    const counts = await TenantService.getTenantValidProofsCount(tenant.user_id)

    // if (!data.find((m) => !m.rent_proof_not_applicable) && isEmpty(counts)) {
    //   throw new AppException('members proof not provided', 400)
    // }
    console.log('income proofs counts=', data)
    // Check is user has income proofs for last 3 month
    const hasUnconfirmedProofs = !!counts.find(
      (i) =>
        !i.credit_score_not_applicable &&
        (([INCOME_TYPE_EMPLOYEE, INCOME_TYPE_WORKER, INCOME_TYPE_CIVIL_SERVANT].includes(
          i.income_type
        ) &&
          parseInt(i.income_proofs_count) < 3) ||
          ([
            INCOME_TYPE_UNEMPLOYED,
            INCOME_TYPE_FREELANCER,
            INCOME_TYPE_PENSIONER,
            INCOME_TYPE_SELF_EMPLOYED,
            INCOME_TYPE_TRAINEE,
            INCOME_TYPE_OTHER_BENEFIT,
            INCOME_TYPE_CHILD_BENEFIT,
          ].includes(i.income_type) &&
            parseInt(i.income_proofs_count) < 1))
    )

    if (hasUnconfirmedProofs) {
      throw new AppException('Member has unconfirmed proofs', ERROR_USER_INCOME_EXPIRE)
    }

    const getConditionRule = (types = []) => {
      return yup.lazy(function (value, { parent }) {
        if (parent.income_type && types.includes(parent.income_type)) {
          return yup.string().required()
        }
        return yup.mixed()
      })
    }

    const schema = yup.object().shape({
      private_use: yup.boolean().required(),
      pets: yup.number().oneOf([PETS_SMALL, PETS_NO]).required(),
      credit_score: yup
        .number()
        .when(['credit_score_submit_later', 'credit_score_not_applicable'], {
          is: (credit_score_submit_later, credit_score_not_applicable) => {
            return credit_score_submit_later || credit_score_not_applicable
          },
          then: yup.number().notRequired().nullable(),
          otherwise: yup.number().min(0).max(100).required(),
        }),
      last_address: yup.string().required(),
      firstname: yup.string().required(),
      secondname: yup.string().required(),
      debt_proof: yup.array().when(['rent_proof_not_applicable', 'rent_arrears_doc_submit_later'], {
        is: (rent_proof_not_applicable, rent_arrears_doc_submit_later) => {
          return rent_proof_not_applicable || rent_arrears_doc_submit_later
        },
        then: yup.array().of(yup.string()).notRequired().nullable(),
        otherwise: yup.array().of(yup.string()).required(),
      }),
      birthday: yup.date().required(),
      birth_place: yup.string().required(),
      unpaid_rental: yup
        .number()
        .positive()
        .oneOf([NO_UNPAID_RENTAL, YES_UNPAID_RENTAL, NO_ANSWER_UNPAID_RENTAL])
        .required(),
      insolvency_proceed: yup
        .number()
        .positive()
        .oneOf([NO_INSOLVENCY, YES_INSOLVENCY, NO_ANSWER_INSOLVENCY])
        .required(),
      clean_procedure: yup
        .number()
        .oneOf([NO_CLEAN_PROCEDURE, YES_CLEAN_PROCEDURE, NO_ANSWER_CLEAN_PROCEDURE])
        .required(),
      income_seizure: yup
        .number()
        .oneOf([NO_INCOME_SEIZURE, YES_INCOME_SEIZURE, NO_ANSWER_INCOME_SEIZURE])
        .required(),
      execution: yup
        .number()
        .oneOf([NO_INCOME_SEIZURE, YES_INCOME_SEIZURE, NO_ANSWER_INCOME_SEIZURE])
        .required(),
      hiring_date: yup.date().nullable(),
      income_type: yup
        .string()
        .oneOf([
          INCOME_TYPE_EMPLOYEE,
          INCOME_TYPE_WORKER,
          INCOME_TYPE_UNEMPLOYED,
          INCOME_TYPE_CIVIL_SERVANT,
          INCOME_TYPE_FREELANCER,
          INCOME_TYPE_HOUSE_WORK,
          INCOME_TYPE_PENSIONER,
          INCOME_TYPE_SELF_EMPLOYED,
          INCOME_TYPE_TRAINEE,
          INCOME_TYPE_OTHER_BENEFIT,
          INCOME_TYPE_CHILD_BENEFIT,
        ])
        .required(),
      income: yup.number().min(0).required(),
      position: getConditionRule([
        INCOME_TYPE_EMPLOYEE,
        INCOME_TYPE_CIVIL_SERVANT,
        INCOME_TYPE_FREELANCER,
        INCOME_TYPE_WORKER,
      ]),
      company: getConditionRule([
        INCOME_TYPE_EMPLOYEE,
        INCOME_TYPE_CIVIL_SERVANT,
        INCOME_TYPE_FREELANCER,
        INCOME_TYPE_WORKER,
      ]),
      employment_type: getConditionRule([HIRING_TYPE_FULL_TIME, HIRING_TYPE_FULL_TIME]),
    })

    let insideTrx = false
    if (!trx) {
      insideTrx = true
      trx = await Database.beginTransaction()
    }

    try {
      await yup.array().of(schema).validate(data)
      tenant.status = STATUS_ACTIVE

      await tenant.save(trx)
      await require('./MatchService').recalculateMatchScoresByUserId(tenant.user_id, trx)

      if (insideTrx) {
        await trx.commit()
      }

      MemberService.calcTenantMemberData(tenant.user_id)
    } catch (e) {
      if (insideTrx) {
        await trx.rollback()
      }

      throw new AppException(e.message, 400)
    }
  }

  /**
   *
   */
  static async deactivateTenant(userId) {
    const trx = await Database.beginTransaction()

    try {
      await MemberService.calcTenantMemberData(userId, trx)
      // Remove New matches
      await Database.table({ _m: 'matches' })
        .where({ '_m.user_id': userId, '_m.status': MATCH_STATUS_NEW })
        .whereNot('_m.buddy', true)
        .delete()
        .transacting(trx)
      await require('./MatchService').recalculateMatchScoresByUserId(userId, trx)

      try {
        const tenant = await Tenant.query().where({ user_id: userId }).first()
        await this.activateTenant(tenant, trx)
      } catch (e) {
        await Tenant.query()
          .update({ status: STATUS_DRAFT, notify_sent: [NOTICE_TYPE_TENANT_PROFILE_FILL_UP_ID] })
          .where({ user_id: userId })
          .transacting(trx)
      }

      await trx.commit()
    } catch (e) {
      await trx.rollback()
      console.log({ e })
    }
  }

  /**
   * Get user saved zone
   */
  static async getTenantZone(userId) {
    return Point.query()
      .whereIn('id', function () {
        this.select('point_id').from('tenants').where({ user_id: userId })
      })
      .first()
  }

  static async updateSelectedAdultsCount(user, adultsCount, trx = null) {
    const tenant = await getOrCreateTenant(user)
    tenant.selected_adults_count = adultsCount
    return tenant.save(trx)
  }

  static async checkAdultsInitialized(userId) {
    const tenant = await Tenant.query()
      .select('selected_adults_count')
      .where({ user_id: userId })
      .first()

    const member = await Member.query().where({ user_id: userId, child: false }).first()

    return tenant && tenant.selected_adults_count && member
  }

  static async updateTenantAddress({ user, address }, trx) {
    if (user && address) {
      let tenant = await getOrCreateTenant(user, trx)
      tenant.address = address

      const { lon, lat } = (await GeoService.geeGeoCoordByAddress(address)) || {}
      if (lon && lat) {
        tenant.coord = `${`${lat}`.slice(0, 12)},${`${lon}`.slice(0, 12)}`
        const point = await GeoService.getOrCreateIsoline(
          { lat, lon },
          tenant.dist_type || TRANSPORT_TYPE_CAR,
          tenant.dist_min || 60
        )
        tenant.point_id = point.id
      }

      await tenant.save(trx)
    }
  }

  static async getCountByFilter({ credit_score_min, credit_score_max, budget_min, budget_max }) {
    let query = Tenant.query()
    if (credit_score_min) {
      query.where('credit_score', '>=', credit_score_min)
    }
    if (credit_score_max) {
      query.where('credit_score', '<=', credit_score_max)
    }

    if (budget_min) {
      query.where('budget_min', '>=', budget_min)
    }

    if (budget_max) {
      query.where('budget_max', '<=', budget_max)
    }

    return (await query.count('*'))[0].count || []
  }

  static async updateSentNotification(tenant, notification_id) {
    const notify_sent = (tenant.notify_sent || []).concat([notification_id])
    await Tenant.query().where('id', tenant.id).update({ notify_sent })
  }

  static async reminderProfileFillUp() {
    try {
      const yesterday = moment.utc(new Date()).add(-1, 'days').format(DATE_FORMAT)
      const draftTenants = (
        await Tenant.query()
          .select('tenants.id', 'tenants.user_id', 'tenants.notify_sent')
          .innerJoin({ _m: 'matches' }, function () {
            this.on('_m.user_id', 'tenants.user_id')
          })
          .innerJoin({ _u: 'users' }, function () {
            this.on('_u.id', 'tenants.user_id').on('_u.status', STATUS_ACTIVE)
          })
          .leftJoin({ _cr: 'estate_sync_contact_requests' }, function () {
            this.on('_cr.user_id', 'tenants.user_id')
          })
          .innerJoin({ _e: 'estates' }, function () {
            this.on('_m.estate_id', '_e.id').onIn('_e.status', [STATUS_ACTIVE, STATUS_EXPIRE])
          })
          .where(function () {
            this.orWhere('_m.status', MATCH_STATUS_KNOCK)
            this.orWhere(function () {
              this.where('_m.buddy', true)
              this.where('_m.status', MATCH_STATUS_KNOCK)
            })
          })
          .whereNotNull('_u.device_token')
          .whereNull('_cr.id')
          .where('_u.created_at', '<=', yesterday)
          .where(function () {
            this.orWhereNull('tenants.notify_sent')
            this.orWhereNot(
              Database.raw(
                `${NOTICE_TYPE_TENANT_PROFILE_FILL_UP_ID} = any("tenants"."notify_sent")`
              )
            )
          })
          .fetch()
      ).toJSON()

      if (!draftTenants?.lenth) {
        return
      }

      const user_ids = draftTenants.map((tenant) => tenant.user_id)
      require('./NoticeService').reminderNotifyProspectFillUpProfile(user_ids)

      await Promise.map(
        draftTenants,
        async (tenant) => {
          await TenantService.updateSentNotification(tenant, NOTICE_TYPE_TENANT_PROFILE_FILL_UP_ID)
        },
        { concurrency: 1 }
      )
    } catch (e) {
      Logger.error(`reminderProfileFillUp error ${e.message || e}`)
    }
  }

  static async requestCertificate(
    { user_id, request_certificate_at, request_certificate_city_id },
    trx = null
  ) {
    if (trx) {
      await Tenant.query()
        .where('user_id', user_id)
        .update({ request_certificate_at, request_certificate_city_id })
        .transacting(trx)
    } else {
      await Tenant.query()
        .where('user_id', user_id)
        .update({ request_certificate_at, request_certificate_city_id })
    }
  }
}

module.exports = TenantService
