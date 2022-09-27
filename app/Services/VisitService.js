const moment = require('moment')
const Database = use('Database')
const {
  DATE_FORMAT,
  LANDLORD_ACTOR,
  PROSPECT_ACTOR,
  ROLE_LANDLORD,
  ROLE_USER,
  STATUS_ACTIVE,
  STATUS_EXPIRE,
  VISIT_MAX_ALLOWED_FOLLOWUPS,
} = require('../constants')
const Estate = use('App/Models/Estate')
const Visit = use('App/Models/Visit')
const NoticeService = use('App/Services/NoticeService')
const AppException = use('App/Exceptions/AppException')

class VisitService {
  /**
   *
   */
  static async getVisitFor15H() {
    const dayStart = moment().startOf('day')
    const date15H = moment().startOf('minute').subtract(1.5, 'hours')
    const date15H5M = date15H.clone().subtract(5, 'minute')
    const subQuery = Database.select('estate_id', Database.raw('MIN(date) as date'))
      .table('visits')
      .where('date', '>=', dayStart.format(DATE_FORMAT))
      .where('date', '<', dayStart.clone().add(1, 'day').format(DATE_FORMAT))
      .groupBy('estate_id')
      .as('_t')

    return Database.from(subQuery)
      .where('date', '>=', date15H5M.format(DATE_FORMAT))
      .where('date', '<', date15H.format(DATE_FORMAT))
  }

  static async followupVisit(estate_id, user_id, auth) {
    const { actor, estate, recipient } = await VisitService.initializeVisitMessaging(
      estate_id,
      user_id,
      auth
    )
    const followupCount = await VisitService.getFollowupCount(estate_id, user_id, actor)
    if (followupCount >= VISIT_MAX_ALLOWED_FOLLOWUPS) {
      throw new AppException(
        `You have already exceeded the maximum of 
        ${VISIT_MAX_ALLOWED_FOLLOWUPS} followups.`,
        422
      )
    }
    await NoticeService.sendFollowUpVisit(recipient, actor, estate)
    await VisitService.incrementFollowup(estate_id, user_id, actor)
  }

  static async initializeVisitMessaging(estate_id, user_id, auth) {
    let actor = LANDLORD_ACTOR
    let estate
    let recipient
    let visit
    switch (auth.user.role) {
      case ROLE_LANDLORD:
        //check if valid estate
        estate = await Estate.query()
          .where({ id: estate_id, user_id: auth.user.id })
          .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
          .first()
        if (!estate) {
          throw new AppException('Invalid Estate')
        }
        //check if recipient/prospect is scheduled for visits (visits table)
        visit = await Visit.query().where('user_id', user_id).where('estate_id', estate_id).first()
        if (!visit) {
          throw new AppException('Not allowed')
        }
        //recipient is the prospect of this visit
        recipient = user_id
        break
      case ROLE_USER:
        //this is NOT needed yet atm. Placeholder for now.
        visit = await Visit.query()
          .where('user_id', auth.user.id)
          .where('estate_id', estate_id)
          .first()
        if (!visit) {
          throw new AppException('Not allowed')
        }
        user_id = auth.user.id
        actor = PROSPECT_ACTOR
        //recipient is the estate owner
        estate = await Estate.query().where('id', estate_id)
        recipient = estate.user_id
        break
    }
    return {
      actor,
      estate,
      recipient,
    }
  }

  static async getFollowupCount(estate_id, user_id, actor = 'landlord') {
    let visits = await Visit.query().where('estate_id', estate_id).where('user_id', user_id).first()
    return visits ? visits[`${actor}_followup_count`] : 0
  }

  static async incrementFollowup(estate_id, user_id, actor = 'landlord') {
    const trx = await Database.beginTransaction()
    try {
      await Visit.query()
        .where('estate_id', estate_id)
        .where('user_id', user_id)
        .update(
          {
            [`${actor}_followup_count`]: Database.raw(`${actor}_followup_count + 1`),
          },
          trx
        )
      await trx.commit()
    } catch (err) {
      await trx.rollback()
      console.log(err.message)
      throw new AppException(err.message)
    }
  }
}

module.exports = VisitService
