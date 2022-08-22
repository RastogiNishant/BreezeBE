'use strict'
const Database = use('Database')
const { omit } = require('lodash')
const { STATUS_ACTIVE, STATUS_DRAFT, STATUS_EXPIRE } = require('../../../constants')
const HttpException = require('../../../Exceptions/HttpException')

const Estate = use('App/Models/Estate')

class PropertyController {
  async getProperties({ request, response }) {
    let estates = await Estate.query()
      .select(Database.raw('estates.*'))
      .select(Database.raw('_u.user'))
      .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])
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
      .with('visits')
      .with('final')
      .with('inviteBuddies')
      .with('knocked')
      .orderBy('estates.updated_at', 'desc')
      .fetch()
    estates = estates.toJSON().map((estate) => {
      estate.visit_count = estate.visits.length
      estate.final_match_count = estate.final.length
      estate.invite_count = estate.knocked.length + estate.inviteBuddies.length
      estate = omit(estate, ['visits', 'final', 'knocked', 'inviteBuddies'])
      return estate
    })
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
