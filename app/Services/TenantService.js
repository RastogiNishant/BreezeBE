'use strict'

const moment = require('moment')
const yup = require('yup')
const { isEmpty } = require('lodash')

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

const {
  MEMBER_FILE_TYPE_RENT,
  MEMBER_FILE_TYPE_DEBT,
  MEMBER_FILE_TYPE_INCOME,
  MEMBER_FILE_TYPE_PASSPORT,

  PETS_BIG,
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
} = require('../constants')
const { getOrCreateTenant } = require('./UserService')

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
    if (fileType === MEMBER_FILE_TYPE_PASSPORT) {
      const passport = await MemberFile.query()
        .where('member_id', memberId)
        .where('id', fileId)
        .where('type', MEMBER_FILE_TYPE_PASSPORT)
        .where('status', STATUS_ACTIVE)
        .first()
      if (!passport) {
        throw new AppException('File not exists')
      }
      return File.getProtectedUrl(passport.file)
    } else if (fileType === MEMBER_FILE_TYPE_INCOME) {
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
  static async updateTenantIsoline(tenantId, trx = null) {
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

    if (trx) return tenant.save(trx)
    return tenant.save()
  }

  static async getTenant(userId) {
    return Tenant.query().select('*').where('user_id', userId).first()
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
      startOf = moment.utc().add(-3, 'month').startOf('month').format('YYYY-MM-DD')
    }

    return Database.table({ _m: 'members' })
      .select(Database.raw(`COUNT(_ip.id) as income_proofs_count`))
      .leftJoin({ _i: 'incomes' }, '_i.member_id', '_m.id')
      .leftJoin({ _ip: 'income_proofs' }, '_ip.income_id', '_i.id')
      .where('_m.user_id', userId)
      .whereNot('_m.child', true)
      .where('_ip.expire_date', '>=', startOf)
      .groupBy(['_m.id', '_ip.income_id'])
  }

  /**
   *
   */
  static async activateTenant(tenant) {
    const counts = await TenantService.getTenantValidProofsCount(tenant.user_id)
    if (isEmpty(counts)) {
      throw new AppException('Invalid members')
    }
    // Check is user has income proofs for last 3 month
    const hasUnconfirmedProofs = !!counts.find((i) => parseInt(i.income_proofs_count) < 3)
    if (hasUnconfirmedProofs) {
      throw new AppException('Member has unconfirmed proofs', ERROR_USER_INCOME_EXPIRE)
    }

    const getRequiredTenantData = (tenantId) => {
      return Database.table({ _t: 'tenants' })
        .select(
          '_t.private_use',
          '_t.pets',
          '_m.firstname',
          '_m.secondname',
          '_m.birthday',
          '_m.last_address',
          '_m.landlord_name',
          '_m.unpaid_rental',
          '_m.insolvency_proceed',
          '_m.clean_procedure',
          '_m.income_seizure',
          '_m.debt_proof',
          '_m.execution',
          '_m.credit_score',
          '_m.credit_score_submit_later',
          '_m.phone_verified',
          '_i.position',
          '_i.company',
          '_i.income_type',
          '_i.hiring_date',
          '_i.income',
          '_i.employment_type'
        )
        .leftJoin({ _m: 'members' }, function () {
          this.on('_m.user_id', '_t.user_id').onNotIn('_m.child', [true])
        })
        .leftJoin({ _i: 'incomes' }, '_i.member_id', '_m.id')
        .where('_t.id', tenantId)
    }
    const data = await getRequiredTenantData(tenant.id)

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
      pets: yup.number().oneOf([PETS_BIG, PETS_SMALL, PETS_NO]).required(),
      credit_score: yup.number().when(['credit_score_submit_later'], {
        is: (credit_score_submit_later) => {
          return credit_score_submit_later
        },
        then: yup.number().notRequired().nullable(),
        otherwise: yup.number().min(0).max(100).required(),
      }),
      last_address: yup.string().required(),
      firstname: yup.string().required(),
      secondname: yup.string().required(),
      debt_proof: yup.string().when(['credit_score_submit_later'], {
        is: (credit_score_submit_later) => {
          return credit_score_submit_later
        },
        then: yup.string().notRequired().nullable(),
        otherwise: yup.string().required(),
      }),
      birthday: yup.date().required(),
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
      hiring_date: yup.date().required(),
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
        ])
        .required(),
      income: yup.number().min(0).required(),
      position: getConditionRule([
        INCOME_TYPE_EMPLOYEE,
        INCOME_TYPE_CIVIL_SERVANT,
        INCOME_TYPE_FREELANCER,
        INCOME_TYPE_HOUSE_WORK,
        INCOME_TYPE_WORKER,
      ]),
      company: getConditionRule([
        INCOME_TYPE_EMPLOYEE,
        INCOME_TYPE_CIVIL_SERVANT,
        INCOME_TYPE_FREELANCER,
        INCOME_TYPE_HOUSE_WORK,
        INCOME_TYPE_WORKER,
      ]),
      employment_type: getConditionRule([
        INCOME_TYPE_EMPLOYEE,
        INCOME_TYPE_CIVIL_SERVANT,
        INCOME_TYPE_FREELANCER,
        INCOME_TYPE_HOUSE_WORK,
        INCOME_TYPE_WORKER,
      ]),
    })

    try {
      await yup.array().of(schema).validate(data)
    } catch (e) {
      console.log(e.message)
      throw new AppException('Invalid tenant data')
    }

    tenant.status = STATUS_ACTIVE
    await tenant.save()
    MemberService.calcTenantMemberData(tenant.user_id)
  }

  /**
   *
   */
  static async deactivateTenant(userId) {
    const trx = await Database.beginTransaction()
    try {
      await Tenant.query().update({ status: STATUS_DRAFT }, trx).where({ user_id: userId })
      await MemberService.calcTenantMemberData(userId, trx)
      // Remove New matches
      await Database.table({ _m: 'matches' })
        .where({ '_m.user_id': userId, '_m.status': MATCH_STATUS_NEW })
        .whereNot('_m.buddy', true)
        .delete()
        .transacting(trx)
      await require('./MatchService').recalculateMatchScoresByUserId(auth.user.id)
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

  static async updateSelectedAdultsCount(user, adultsCount, trx) {
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
}

module.exports = TenantService
