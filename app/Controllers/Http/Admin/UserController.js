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
} = require('../../../constants')
const {
  exceptions: { ACCOUNT_NOT_VERIFIED_USER_EXIST },
} = require('../../../exceptions')
const QueueService = use('App/Services/QueueService')
const UserDeactivationSchedule = use('App/Models/UserDeactivationSchedule')
const { isHoliday } = require('../../../Libs/utils')
const Promise = require('bluebird')

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
      throw new HttpException('Forbidden', 403)
    }

    return response.res({ token: token.token, user, roles })
  }

  /**
   * This endpoint is wrong on the roles. roles can be agg'd by email
   */
  async getUsers({ request, response }) {
    const { filters, order, role } = request.only(['filters', 'order', 'role'])

    const query = User.query()
      .select(Database.raw(`users.*, concat(users.firstname, ' ', users.secondname) as fullname`))
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

          UserService.emitAccountEnabled(ids, true)
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
              .update({ status: STATUS_DRAFT })
              .transacting(trx)
          }

          //TODO: we should delete user deactivation schedule here also
          await trx.commit()
          ids.map((id) => {
            Event.fire('mautic:syncContact', id, { admin_approval_date: null })
          })
          //send notifications
          NoticeService.landlordsDeactivated(ids, estateIds)
          UserService.emitAccountEnabled(ids, false)
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
          const tzOffset = 2
          let workingDaysAdded = 0
          let deactivateDateTime
          let daysAdded = 0
          //calculate when the deactivation will occur.
          do {
            daysAdded++
            deactivateDateTime = moment().utcOffset(tzOffset).add(daysAdded, 'days')
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

  async getLandlords({ request, response }) {
    let { activation_status, status, estate_status, page, limit, query } = request.all()
    if (!activation_status) {
      activation_status = [
        USER_ACTIVATION_STATUS_NOT_ACTIVATED,
        USER_ACTIVATION_STATUS_ACTIVATED,
        USER_ACTIVATION_STATUS_DEACTIVATED,
      ]
    }
    status = status || STATUS_ACTIVE
    estate_status = estate_status || STATUS_DRAFT
    limit = 99999
    const landlordQuery = User.query()
      .select(
        'id',
        'firstname',
        'secondname',
        'email',
        'phone',
        Database.raw(`to_char(created_at, '${ISO_DATE_FORMAT}') as created_at`),
        'company_id',
        'status',
        'activation_status',
        Database.raw(`to_char(verified_date, '${ISO_DATE_FORMAT}') as verified_date`)
      )
      .where('role', ROLE_LANDLORD)
      .whereIn('status', isArray(status) ? status : [status])
      .whereIn(
        'activation_status',
        isArray(activation_status) ? activation_status : [activation_status]
      )
      .with('estates', function (e) {
        e.select('id', 'user_id', 'status')
        e.whereNot('status', STATUS_DELETE)
        e.whereIn('status', isArray(estate_status) ? estate_status : [estate_status])
        e.withCount('current_tenant', function (q) {
          q.whereNotNull('user_id')
        })
      })
      .with('company', function (query) {
        query.with('contacts')
      })
      .with('deactivationSchedule')
    if (query) {
      landlordQuery.andWhere(function (d) {
        d.orWhere('email', 'ilike', `${query}%`)
        d.orWhere('firstname', 'ilike', `${query}%`)
        d.orWhere('secondname', 'ilike', `${query}%`)
      })
    }
    const landlords = await landlordQuery.orderBy('users.id', 'asc').paginate(page, limit)
    //let's return all info... this is admin
    const users = landlords.toJSON({ publicOnly: false })
    return response.res(users)
  }
}

module.exports = UserController
