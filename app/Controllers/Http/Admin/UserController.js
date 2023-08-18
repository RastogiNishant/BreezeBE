'use strict'

const User = use('App/Models/User')
const Database = use('Database')
const Estate = use('App/Models/Estate')
const Event = use('Event')

const UserService = use('App/Services/UserService')
const AppException = use('App/Exceptions/AppException')
const HttpException = use('App/Exceptions/HttpException')
const NoticeService = use('App/Services/NoticeService')
const MailService = use('App/Services/MailService')
const File = use('App/Classes/File')

const moment = require('moment')
const { isArray, isEmpty, includes } = require('lodash')
const {
  ISO_DATE_FORMAT,
  ROLE_ADMIN,
  ROLE_LANDLORD,
  USER_ACTIVATION_STATUS_NOT_ACTIVATED,
  USER_ACTIVATION_STATUS_ACTIVATED,
  USER_ACTIVATION_STATUS_DEACTIVATED,
  STATUS_DELETE,
  STATUS_ACTIVE,
  STATUS_DRAFT,
  STATUS_EXPIRE,
  DEACTIVATE_LANDLORD_AT_END_OF_DAY,
  DEFAULT_LANG,
  WEBSOCKET_EVENT_USER_ACTIVATE,
  WEBSOCKET_EVENT_USER_DEACTIVATE,
  STATUS_OFFLINE_ACTIVE,
  PUBLISH_STATUS_INIT,
  ROLE_USER,
} = require('../../../constants')
const {
  exceptions: { ACCOUNT_NOT_VERIFIED_USER_EXIST, USER_WRONG_PASSWORD },
} = require('../../../exceptions')
const QueueService = use('App/Services/QueueService')
const UserDeactivationSchedule = use('App/Models/UserDeactivationSchedule')
const { isHoliday } = require('../../../Libs/utils')
const Promise = require('bluebird')
const CompanyService = require('../../../Services/CompanyService')

class UserController {
  /**
   * admin login
   */
  async login({ request, auth, response }) {
    const { email, password } = request.all()
    const authenticator = await auth.authenticator('jwtAdmin')

    const uid = User.getHash(email, ROLE_ADMIN)

    const token = await authenticator.attempt(uid, password)

    const user = await User.findByOrFail({ email, role: ROLE_ADMIN })
    const roles = await user.getRoles()
    if (isEmpty(roles)) {
      throw new HttpException(USER_WRONG_PASSWORD, 403)
    }

    return response.res({ token: token.token, user, roles })
  }

  /**
   * This endpoint is wrong on the roles. roles can be agg'd by email
   */
  async getUsers({ request, response }) {
    const { filters, order, role } = request.only(['filters', 'order', 'role'])

    const query = User.query()
      .select(
        Database.raw(
          `users.*, users.created_at::timestamp at time zone 'UTC' as created_at,
          concat(users.firstname, ' ', users.secondname) as fullname`
        )
      )
      .where('role', role)
      .whereNot('status', STATUS_DELETE)
      .filter(filters)
      .orderBy(order.by, order.direction)

    const users = await query.fetch()
    //FIXME: should propbably add an isAdmin param here...
    response.res(users.toJSON({ isOwner: true }))
  }

  //this is missing before... just the basic query on users using id
  async getUser({ request, response }) {
    const user_id = request.params.user_id
    const user = await User.query().where('id', user_id).first()
    response.res(user)
  }

  async updateUser({ request, response }) {
    const user_id = request.params.user_id
    response.res({ user_id })
  }

  async verifyUsers({ request, auth, response }) {
    const { ...data } = request.all()
    const userId = auth.user.id
    await UserService.verifyUsers(userId, data.ids, data.is_verify)
    NoticeService.verifyUserByAdmin(data.ids)
    response.res(data)
  }

  async updateActivationStatus({ request, auth, response }) {
    const { ids, action } = request.all()
    let affectedRows = 0
    const trx = await Database.beginTransaction()
    switch (action) {
      case 'activate':
        try {
          const users = await UserService.getLangByIds({ ids, status: STATUS_ACTIVE })
          if (users.length !== ids.length) {
            throw new HttpException(ACCOUNT_NOT_VERIFIED_USER_EXIST, 400)
          }

          affectedRows = await User.query().whereIn('id', ids).where('role', ROLE_LANDLORD).update(
            {
              activation_status: USER_ACTIVATION_STATUS_ACTIVATED,
              is_verified: true,
              verified_by: auth.user.id,
              verified_date: moment().utc().format(),
            },
            trx
          )

          await UserDeactivationSchedule.query().whereIn('user_id', ids).delete(trx)
          await trx.commit()

          NoticeService.verifyUserByAdmin(ids)
          ids.map((id) => {
            Event.fire('mautic:syncContact', id, { admin_approval_date: new Date() })
          })

          users.map((user) => {
            MailService.sendLandlordActivateEmail(user.email, {
              user,
              lang: user.lang ?? DEFAULT_LANG,
            })
          })

          UserService.emitAccountEnabled(ids, {
            activation_status: USER_ACTIVATION_STATUS_ACTIVATED,
            activated: true,
          })
          return response.res({ affectedRows })
        } catch (err) {
          console.log(err.message)
          await trx.rollback()
          throw new HttpException(err.message, 422)
        }

      case 'deactivate':
        try {
          affectedRows = await User.query().whereIn('id', ids).update(
            {
              activation_status: USER_ACTIVATION_STATUS_DEACTIVATED,
              is_verified: false,
              verified_by: null,
              verified_date: null,
            },
            trx
          )
          //make owned estates draft
          const estateIds = (
            await Estate.query()
              .select('*')
              .whereIn('user_id', ids)
              .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
              .fetch()
          ).rows.map((estate) => estate.id)

          if (estateIds.length > 0) {
            await Estate.query()
              .whereIn('id', estateIds)
              .update({ status: STATUS_DRAFT, publish_status: PUBLISH_STATUS_INIT })
              .transacting(trx)
          }

          //TODO: we should delete user deactivation schedule here also
          await trx.commit()
          ids.map((id) => {
            Event.fire('mautic:syncContact', id, { admin_approval_date: null })
          })
          //send notifications
          NoticeService.landlordsDeactivated(ids, estateIds)
          UserService.emitAccountEnabled(ids, {
            activation_status: USER_ACTIVATION_STATUS_DEACTIVATED,
            activated: false,
          })
          return response.res({ affectedRows })
        } catch (err) {
          console.log(err.message)
          await trx.rollback()
          throw new HttpException(err.message, 422)
        }
      case 'deactivate-in-2-days':
        try {
          await Promise.map(ids, async (id) => {
            const user = await User.query().where('id', id).where('role', ROLE_LANDLORD).first()
            if (!user) {
              throw new AppException('Landlord not found.', 400)
            }
            //check if this user is already on deactivation schedule
            const scheduled = await UserDeactivationSchedule.query().where('user_id', id).first()
            if (scheduled) {
              throw new AppException(`Landlord ${id} is already booked for deactivation`, 400)
            }
          })
          //FIXME: tzOffset should be coming from header or body of request
          let workingDaysAdded = 0
          let deactivateDateTime
          let daysAdded = 0
          //calculate when the deactivation will occur.
          do {
            daysAdded++
            deactivateDateTime = moment().utc().add(daysAdded, 'days')
            if (
              !(
                isHoliday(deactivateDateTime.format('yyyy-MM-DD')) ||
                includes(['Saturday', 'Sunday'], deactivateDateTime.format('dddd'))
              )
            ) {
              workingDaysAdded++
            }
          } while (workingDaysAdded < 2)

          let delay
          if (DEACTIVATE_LANDLORD_AT_END_OF_DAY) {
            deactivateDateTime = deactivateDateTime.format('yyyy-MM-DDT23:59:59+02:00')
            delay = 1000 * (moment(deactivateDateTime).utc().unix() - moment().utc().unix())
          } else {
            deactivateDateTime = deactivateDateTime.format('yyyy-MM-DDThh:mm:ss+2:00')
            delay = 1000 * 60 * 60 * 24 * daysAdded //number of milliseconds from now. Use this on Queue
          }
          await Promise.map(ids, async (id) => {
            const deactivationSchedule = await UserDeactivationSchedule.create(
              {
                user_id: id,
                deactivate_schedule: deactivateDateTime,
              },
              trx
            )
            QueueService.deactivateLandlord(deactivationSchedule.id, id, delay)
          })
          await trx.commit()
          await NoticeService.deactivatingLandlordsInTwoDays(ids, deactivateDateTime)
          return response.res(true)
        } catch (err) {
          console.log(err)
          await trx.rollback()
          throw new HttpException(err.message, 422)
        }
      case 'deactivate-by-date':
        return response.res({ message: 'action not implemented yet.' })
    }
    await trx.rollback()
    response.res(false)
  }

  landlordQuery({ status, activation_status, estate_status, light }) {
    const query = User.query()
      .select(
        'id',
        'firstname',
        'secondname',
        'email',
        'phone',
        'created_at',
        'company_id',
        'status',
        'activation_status',
        'ip_based_info',
        'frontend_used',
        Database.raw(
          `case when _e.max_percent_complete is null then 0 else _e.max_percent_complete end`
        ),
        Database.raw(`case when _dc.document_count is null then 0 else _dc.document_count end`),
        Database.raw(`_f.files_count`),
        Database.raw(`_i.room_image_count`),
        Database.raw(`to_char(verified_date, '${ISO_DATE_FORMAT}') as verified_date`),
        Database.raw(`to_char(last_login, '${ISO_DATE_FORMAT}') as last_login`)
      )
      .where('role', ROLE_LANDLORD)
      .whereIn('status', isArray(status) ? status : [status])
      .whereIn(
        'activation_status',
        isArray(activation_status) ? activation_status : [activation_status]
      )
      .with('estates', function (e) {
        if (light && +light === 1) {
          e.select('id', 'user_id', 'status', 'address')
        }
        e.whereNot('status', STATUS_DELETE)
        e.whereIn('status', isArray(estate_status) ? estate_status : [estate_status])
        e.withCount('current_tenant', function (q) {
          q.whereNotNull('user_id')
        })
      })
      .leftJoin(
        Database.raw(
          `(select user_id, max("percent") as max_percent_complete
          from estates where status not in(${STATUS_DELETE}) group by user_id) as _e`
        ),
        '_e.user_id',
        'users.id'
      )
      .leftJoin(
        Database.raw(
          `(select user_id, count(id) as document_count from estates
          where energy_proof is not null group by user_id) as _dc`
        ),
        '_dc.user_id',
        'users.id'
      )
      .leftJoin(
        Database.raw(`(select users.id as user_id, count(files.id) as files_count from users 
          left join estates on users.id=estates.user_id
          left join files on files.estate_id = estates.id
           group by users.id
        ) as _f`),
        '_f.user_id',
        'users.id'
      )
      .leftJoin(
        Database.raw(`(select users.id as user_id, count(images.id) as room_image_count from users
          left join estates on users.id=estates.user_id
          left join rooms on rooms.estate_id=estates.id
          left join images on images.room_id =rooms.id
          group by users.id
        ) as _i`),
        '_i.user_id',
        'users.id'
      )
      .with('company', function (query) {
        query.with('contacts')
      })
      .with('deactivationSchedule')

    return query
  }

  async getLandlords({ request, response }) {
    let { activation_status, status, estate_status, page, limit, query, today } = request.all()
    let { light } = request.get()
    if (!activation_status) {
      activation_status = [
        USER_ACTIVATION_STATUS_NOT_ACTIVATED,
        USER_ACTIVATION_STATUS_ACTIVATED,
        USER_ACTIVATION_STATUS_DEACTIVATED,
      ]
    }
    status = status || STATUS_ACTIVE
    estate_status = estate_status || [
      STATUS_ACTIVE,
      STATUS_EXPIRE,
      STATUS_DRAFT,
      STATUS_OFFLINE_ACTIVE,
    ]
    limit = 99999
    const landlordQuery = this.landlordQuery({ status, estate_status, activation_status, light })
    if (query) {
      landlordQuery.andWhere(function (d) {
        d.orWhere('email', 'ilike', `${query}%`)
        d.orWhere('firstname', 'ilike', `${query}%`)
        d.orWhere('secondname', 'ilike', `${query}%`)
      })
    }
    if (today) {
      landlordQuery.where(Database.raw(`created_at::date=CURRENT_DATE`))
    }
    const landlords = await landlordQuery.orderBy('users.id', 'asc').paginate(page, limit)
    //console.log({ landlords: landlords.toJSON({ isOwner: true }).data[10] })
    //let's return all info... this is admin
    const users = landlords.toJSON({ publicOnly: false })
    return response.res(users)
  }

  async addUser({ request, response }) {
    const { email, password, role, company_name, company_size } = request.all()
    const trx = await Database.beginTransaction()

    try {
      //don't send verification email
      const user = await UserService.signUp({ email, password, role }, trx, false)
      const company = await CompanyService.createCompany(
        { type: 'private', name: company_name, size: company_size, status: STATUS_ACTIVE },
        user.id,
        trx
      )
      user.firstname = company_name
      user.company_id = company.id
      user.status = STATUS_ACTIVE
      await user.save(trx)
      /*await User.query()
        .where('id', user.id)
        .update({ status: STATUS_ACTIVE, firstname: company_name, company_id: company.id }, trx)*/
      await trx.commit()
      return response.res(user)
    } catch (err) {
      await trx.rollback()
      if (err.message) throw new HttpException(err.message)

      throw new HttpException('Error found while adding user.')
    }
  }

  prospectQuery(single = false) {
    const query = User.query()
      .select(
        'users.id',
        'users.email',
        'users.firstname',
        'users.secondname',
        'tenants.address',
        'ect.current_estates',
        'users.status',
        'tenants.members_count',
        'tenants.credit_score',
        'tenants.income'
      )
      .leftJoin('tenants', 'tenants.user_id', 'users.id')
      .leftJoin(
        Database.raw(`(select
          estate_current_tenants.user_id,
          array_agg(
            json_build_object(
              'estate_id', estates.id,
              'property_id', estates.property_id,
              'address', estates.address
            )
          ) as current_estates
        from estate_current_tenants
        left join estates
        on estates.id=estate_current_tenants.estate_id
        group by estate_current_tenants.user_id
        ) ect`),
        'ect.user_id',
        'users.id'
      )

    if (single) {
      query.select('_m.member_info').leftJoin(
        Database.raw(`
          (select
            members.user_id,
            array_agg(
              json_build_object(
                'member_id', members.id,
                'firstname', members.firstname,
                'secondname', members.secondname,
                'rent_arrears', members.rent_arrears_doc,
                'credit_score', members.credit_score,
                'debt_proof', members.debt_proof,
                'files', mf.files,
                'incomes', mi.member_incomes
              )
            ) as member_info
          from
            members
          left join
            (select
              member_id,
              array_agg(
                json_build_object(
                  'type', "type",
                  'file', file
                )
              ) as files from
            member_files
            group by member_id
            ) mf
          on mf.member_id=members.id
          left join
          (select
            member_id,
            array_agg(json_build_object(
              'employment_type', incomes.employment_type,
              'profession', incomes.profession,
              'position', incomes.position,
              'income', incomes.income,
              'company', incomes.company)
            ) as member_incomes
            from incomes
            group by member_id
            ) mi
          on mi.member_id=members.id    
          group by
            members.user_id
          ) as _m`),
        '_m.user_id',
        'users.id'
      )
    }
    return query
  }

  async getProspects({ request, response }) {
    let { page, limit = 20 } = request.all()
    if (!page || page < 1) {
      page = 1
    }
    const prospects = await this.prospectQuery(false)
      .whereNot('users.status', STATUS_DELETE)
      .where('role', ROLE_USER)
      .orderBy('updated_at', 'desc')
      .paginate(page, limit)
    return response.res(prospects)
  }

  async getProspect({ request, response }) {
    const { id } = request.all()
    const prospect = await this.prospectQuery(true)
      .where('users.id', id)
      .whereNot('users.status', STATUS_DELETE)
      .where('role', ROLE_USER)
      .first()

    if (!prospect) {
      throw new HttpException('User Not Found!', 400)
    }
    prospect.member_info = await Promise.map(prospect.member_info, async (member) => {
      member.rent_arrears = member.rent_arrears
        ? await File.getProtectedUrl(member.rent_arrears)
        : null
      member.debt_proof = member.debt_proof ? await File.getProtectedUrl(member.debt_proof) : null
      if (Array.isArray(member.files)) {
        member.files = await Promise.map(member.files, async (file) => {
          file.file = file.file ? await File.getProtectedUrl(file.file) : null
          return file
        })
      }
      return member
    })

    return response.res(prospect)
  }
}

module.exports = UserController
