'use strict'
const Database = use('Database')
const moment = require('moment')
const {
  STATUS_ACTIVE,
  STATUS_DRAFT,
  STATUS_EXPIRE,
  DAY_FORMAT,
  MATCH_STATUS_INVITE,
  MATCH_STATUS_FINISH,
} = require('../../../constants')
const HttpException = require('../../../Exceptions/HttpException')

const Estate = use('App/Models/Estate')

class PropertyController {
  async getProperties({ request, response }) {
    const currentDayFormatted = moment().startOf('day').format(DAY_FORMAT)

    let estates = await Estate.query()
      .select(Database.raw('estates.*'))
      .select(Database.raw('_u.user'))
      .select(Database.raw('coalesce(_v.visit_count, 0) as visit_count'))
      .select(Database.raw('coalesce(_i.invite_count, 0) as invite_count'))
      .select(Database.raw('coalesce(_f.match_count, 0) as final_match_count'))
      .whereIn('estates.status', [STATUS_ACTIVE, STATUS_DRAFT, STATUS_EXPIRE])
      //owner
      .innerJoin(
        Database.raw(`(select
          jsonb_build_object('firstname', users.firstname, 'secondname', users.secondname, 'email', users.email) as user,
          users.id as user_id
        from
          users
        ) as _u`),
        'estates.user_id',
        '_u.user_id'
      )
      //visits
      .leftJoin(
        Database.raw(`(select
          COUNT(visits)::int as visit_count,
          visits.estate_id
        from
          visits
        left join time_slots
        on time_slots.estate_id=visits.estate_id
        and visits.start_date >=time_slots.start_at
        and visits.end_date <= time_slots.end_at
        and time_slots.end_at <= '${currentDayFormatted}'
        group by
        visits.estate_id
        ) as _v`),
        'estates.id',
        '_v.estate_id'
      )
      //invites
      .leftJoin(
        Database.raw(`(select count(*) as invite_count, estate_id
        from matches
        WHERE status=${MATCH_STATUS_INVITE}
        group by estate_id
        ) as _i`),
        '_i.estate_id',
        'estates.id'
      )
      //final matches
      .leftJoin(
        Database.raw(`(select count(*) as match_count, estate_id
        from matches
        WHERE status=${MATCH_STATUS_FINISH}
        group by estate_id
        ) as _f`),
        '_f.estate_id',
        'estates.id'
      )
      .orderBy('estates.updated_at', 'desc')
      .fetch()
    estates = estates.toJSON()
    return response.res(estates)
  }

  async updatePublishStatus({ request, response }) {
    const { ids, action } = request.all()
    const trx = await Database.beginTransaction()
    let affectedRows
    switch (action) {
      case 'publish':
        try {
          //what will happen to previous matches when it is published?
          affectedRows = await Estate.query()
            .whereIn('id', ids)
            .update({ status: STATUS_ACTIVE }, trx)
          await trx.commit()
          return response.res(affectedRows)
        } catch (error) {
          await trx.rollback()
          throw new HttpException(error.message, 422)
        }
      case 'unpublish':
        try {
          //what will happen to previous matches when it is unpublished?
          affectedRows = await Estate.query()
            .whereIn('id', ids)
            .update({ status: STATUS_DRAFT }, trx)
          await trx.commit()
          return response.res(affectedRows)
        } catch (error) {
          await trx.rollback()
          throw new HttpException(error.message, 422)
        }
    }
    await trx.rollback()
    throw new HttpException('Action not allowed.')
  }
}

module.exports = PropertyController
