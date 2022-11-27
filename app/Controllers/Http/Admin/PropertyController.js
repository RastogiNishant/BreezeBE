'use strict'
const Database = use('Database')
const EstateService = use('App/Services/EstateService')
const { STATUS_ACTIVE, STATUS_DRAFT, STATUS_EXPIRE } = require('../../../constants')
const Promise = require('bluebird')
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
      .withCount('visits')
      .withCount('final')
      .withCount('inviteBuddies')
      .withCount('knocked')
      .orderBy('estates.updated_at', 'desc')
      .fetch()
    estates = estates.toJSON().map((estate) => {
      estate.invite_count =
        parseInt(estate['__meta__'].knocked_count) +
        parseInt(estate['__meta__'].inviteBuddies_count)
      estate.visit_count = parseInt(estate['__meta__'].visits_count)
      estate.final_match_count = parseInt(estate['__meta__'].final_count)
      return estate
    })
    return response.res(estates)
  }

  async updatePublishStatus({ request, response }) {
    const { ids, action } = request.all()
    const trx = await Database.beginTransaction()
    let affectedRows
    switch (action) {
      /*
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
        }*/
      case 'unpublish':
        try {
          await Promise.map(ids, async (id) => {
            await EstateService.handleOfflineEstate(id, trx)
          })
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