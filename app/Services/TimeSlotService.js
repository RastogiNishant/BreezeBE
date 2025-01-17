const { props } = require('bluebird')
const { range, findIndex, get, omit } = require('lodash')
const moment = require('moment')
const { DATE_FORMAT, DAY_FORMAT } = require('../constants')
const AppException = use('App/Exceptions/AppException')
const HttpException = use('App/Exceptions/HttpException')
const Database = use('Database')
const Estate = use('App/Models/Estate')
const TimeSlot = use('App/Models/TimeSlot')
const NoticeService = use('App/Services/NoticeService')
const Logger = use('Logger')
const Promise = require('bluebird')

const {
  exceptions: {
    INVALID_TIME_RANGE,
    TIME_SLOT_CROSSING_EXISTING,
    TIME_SLOT_NOT_FOUND,
    SHOW_ALREADY_STARTED,
    FAILED_CREATE_TIME_SLOT,
    ESTATE_NOT_EXISTS
  },
  exceptionCodes: { SHOW_ALREADY_STARTED_ERROR_CODE }
} = require('../exceptions')
class TimeSlotService {
  static async createSlot({ end_at, start_at, slot_length, estate_id, user_id }, trx) {
    start_at = moment.utc(start_at).format(DATE_FORMAT)
    end_at = moment.utc(end_at).format(DATE_FORMAT)
    TimeSlotService.validateTimeRange({ end_at, start_at, slot_length })

    // Checks is time slot crossing existing
    const existing = await this.getCrossTimeslotQuery(
      { end_at, start_at, estate_id },
      user_id
    ).first()

    if (existing) {
      throw new AppException(TIME_SLOT_CROSSING_EXISTING)
    }

    try {
      const slot = await TimeSlot.createItem(
        {
          start_at,
          end_at,
          slot_length,
          estate_id
        },
        trx
      )
      await require('./EstateService').updatePercentAndIsPublished(
        { estate_id, slots: [slot.toJSON()] },
        trx
      )
      return slot
    } catch (e) {
      console.log('timeslot here error', e.message)
      throw new HttpException(FAILED_CREATE_TIME_SLOT, 400)
    }
  }

  static async createSlotMany({ user_id, estate_id, data }) {
    const EstateService = require('./EstateService')
    const estate = await EstateService.getActiveEstateQuery()
      .where('user_id', user_id)
      .where('id', estate_id)
      .first()
    if (!estate) {
      throw new HttpException(ESTATE_NOT_EXISTS, 400)
    }

    const estateIds = await EstateService.getEstateIdsInBuilding(estate_id)

    const trx = await Database.beginTransaction()
    try {
      if (data.is_not_show !== undefined) {
        await EstateService.updateShowRequired(
          { id: estateIds, is_not_show: data.is_not_show },
          trx
        )
      }

      let slots = []
      if (data.start_at && data.end_at) {
        slots = await Promise.map(
          estateIds,
          async (estate_id) => {
            return (
              await TimeSlotService.createSlot(
                { ...omit(data, ['is_not_show']), estate_id, user_id },
                trx
              )
            ).toJSON()
          },
          { concurrency: 1 }
        )
      }

      await trx.commit()
      const slot = slots?.filter((slot) => slot.estate_id === estate_id)?.[0] || {}
      return {
        is_not_show: data.is_not_show,
        ...slot
      }
    } catch (e) {
      Logger.error(e)
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  static async updateTimeSlot({ user_id, data }, trx) {
    const { estate_id, slot_id, ...rest } = data
    const slot = await this.getTimeSlotByOwner(user_id, slot_id)

    if (!slot) {
      throw new HttpException(TIME_SLOT_NOT_FOUND, 404)
    }

    const { slot_length, end_at, start_at } = slot.toJSON()

    try {
      const updatedSlot = await this.updateSlot(slot, rest, trx)
      const MatchService = require('./MatchService')
      let removeVisitsAt = []

      if (rest?.slot_length && +rest?.slot_length !== +slot_length) {
        removeVisitsAt = [{ start_at, end_at }]
      } else {
        removeVisitsAt = TimeSlotService.getNotCrossRange({
          start_at: updatedSlot.start_at,
          end_at: updatedSlot.end_at,
          prev_start_at: updatedSlot.prev_start_at,
          prev_end_at: updatedSlot.prev_end_at
        })
      }

      const invitedUserIds = await MatchService.getInvitedUserIds(estate_id)

      let visitIds = []
      await Promise.all(
        (removeVisitsAt || []).map(async (rvAt) => {
          const visitsIn =
            (await MatchService.getVisitsIn({
              estate_id,
              start_at: rvAt.start_at,
              end_at: rvAt.end_at
            })) || []
          if (visitsIn && visitsIn.length) {
            visitIds = visitsIn.map((v) => v.user_id)
            await MatchService.handleMatchesOnTimeSlotUpdate(estate_id, visitIds, trx)
          }
        })
      )

      const notifyUserIds = visitIds.concat(invitedUserIds || [])
      if (notifyUserIds && notifyUserIds.length) {
        NoticeService.updateTimeSlot(estate_id, notifyUserIds)
      }

      return updatedSlot
    } catch (e) {
      throw new HttpException(e.message, e.status || 500)
    }
  }

  /**
   * Check if existing slot after update will not cross another existing slots
   */
  static async updateSlot(slot, data, trx = null) {
    const slotJSON = slot.toJSON()
    slot.prev_start_at = moment(slotJSON?.start_at).format(DATE_FORMAT)
    slot.prev_end_at = moment(slotJSON?.end_at).format(DATE_FORMAT)
    slot.merge(data)

    TimeSlotService.validateTimeRange(slot)

    const estate = await Estate.find(slot.estate_id)
    const crossingSlot = await this.getCrossTimeslotQuery(
      { end_at: slot.end_at, start_at: slot.start_at, estate_id: estate.id },
      estate.user_id
    )
      .whereNot('id', slot.id)
      .first()

    if (crossingSlot) {
      throw new AppException(TIME_SLOT_CROSSING_EXISTING)
    }
    await slot.save(trx)
    return slot
  }

  static async updateSlotMany(user_id, data) {
    const EstateService = require('./EstateService')
    const estate_ids = await EstateService.getEstateIdsInBuilding(data.estate_id)
    const trx = await Database.beginTransaction()
    try {
      if (data.is_not_show !== undefined) {
        await EstateService.updateShowRequired(
          {
            id: estate_ids,
            is_not_show: data.is_not_show
          },
          trx
        )
      }

      const slot = await this.getTimeSlotByOwner(user_id, data.slot_id)
      if (!slot) {
        throw new HttpException(TIME_SLOT_NOT_FOUND, 404)
      }

      let slots = await this.getSameTimeSlotInBuilding({
        estateId: estate_ids,
        start_at: moment(slot.start_at).format(DATE_FORMAT),
        end_at: moment(slot.end_at).format(DATE_FORMAT)
      })

      if (data.start_at && data.end_at) {
        slots = await Promise.map(slots, async (slot) => {
          return (
            await TimeSlotService.updateTimeSlot(
              { user_id, data: { ...omit(data, ['is_not_show']), slot_id: slot.id } },
              trx
            )
          ).toJSON()
        })
      }
      await trx.commit()
      const newSlot = slots?.filter((slot) => slot.estate_id === data.estate_id)?.[0] || {}
      return {
        is_not_show: data.is_not_show,
        ...newSlot
      }
    } catch (e) {
      Logger.error(e)
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  static validateTimeRange({ start_at, end_at, slot_length }) {
    if (slot_length) {
      const minDiff = moment.utc(end_at).diff(moment.utc(start_at), 'minutes')
      if (minDiff % slot_length !== 0) {
        throw new AppException(INVALID_TIME_RANGE, 400)
      }
    }
    return true
  }

  static getNotCrossRange({ start_at, end_at, prev_start_at, prev_end_at }) {
    const removeVisitRanges = []
    if (start_at <= prev_start_at && end_at >= prev_end_at) {
      return removeVisitRanges
    } else {
      if (prev_start_at < start_at && prev_end_at > end_at) {
        removeVisitRanges.push({ start_at: prev_start_at, end_at: start_at })
        removeVisitRanges.push({ start_at: end_at, end_at: prev_end_at })
      } else if (prev_start_at >= start_at && end_at >= prev_start_at && prev_end_at > end_at) {
        removeVisitRanges.push({ start_at: end_at, end_at: prev_end_at })
      } else if (prev_start_at < start_at && start_at <= prev_end_at && prev_end_at <= end_at) {
        removeVisitRanges.push({ start_at: prev_start_at, end_at: start_at })
      } else if (prev_start_at > start_at && prev_start_at >= end_at) {
        removeVisitRanges.push({ start_at: prev_start_at, end_at: prev_end_at })
      } else if (start_at > prev_start_at && start_at >= prev_end_at) {
        removeVisitRanges.push({ start_at: prev_start_at, end_at: prev_end_at })
      }
    }
    return removeVisitRanges
  }

  static getCrossTimeslotQuery({ end_at, start_at, estate_id }, userId) {
    return TimeSlot.query()
      .whereIn('estate_id', function () {
        this.select('id').from('estates').where('user_id', userId).where('estate_id', estate_id)
      })
      .where(function () {
        this.orWhere(function () {
          this.where('start_at', '>', start_at).where('start_at', '<', end_at)
        })
          .orWhere(function () {
            this.where('end_at', '>', start_at).where('end_at', '<', end_at)
          })
          .orWhere(function () {
            this.where('start_at', '<=', start_at).where('end_at', '>=', end_at)
          })
      })
  }

  static async getTimeSlotByOwner(userId, slotId) {
    return TimeSlot.query()
      .select('time_slots.*')
      .innerJoin({ _e: 'estates' }, '_e.id', 'time_slots.estate_id')
      .where('_e.user_id', userId)
      .where('time_slots.id', slotId)
      .first()
  }

  static async getTimeSlotsByEstate(estate) {
    if (estate && estate.id) {
      return TimeSlot.query()
        .select('time_slots.*', Database.raw('COUNT(visits)::int as visitCount'))
        .where('time_slots.estate_id', estate.id)
        .leftJoin('visits', function () {
          this.on('visits.start_date', '>=', 'time_slots.start_at')
            .on('visits.end_date', '<=', 'time_slots.end_at')
            .on('visits.estate_id', 'time_slots.estate_id')
        })
        .groupBy('time_slots.id')
        .orderBy([{ column: 'end_at', order: 'desc' }])
        .fetch()
    } else return null
  }

  static async getFreeTimeslots(estateId) {
    const dateFrom = moment().utc().format(DATE_FORMAT)
    // Get estate available slots
    const getSlots = async () => {
      return Database.table('time_slots')
        .select('slot_length')
        .select(Database.raw('extract(epoch from start_at) as start_at'))
        .select(Database.raw('extract(epoch from end_at) as end_at'))
        .where({ estate_id: estateId })
        .where(function () {
          this.orWhere('start_at', '>=', dateFrom)
          this.orWhere(function () {
            this.where('start_at', '<', dateFrom)
            this.where('end_at', '>', dateFrom)
          })
        })
        .orderBy('start_at')
        .limit(500)
    }

    // Get estate visits (booked time units)
    const getVisits = async () => {
      return Database.table('visits')
        .select(Database.raw('extract(epoch from date) as visit_date'))
        .where({ estate_id: estateId })
        .where('date', '>=', dateFrom)
        .orderBy('date')
        .limit(500)
    }

    let { slots, visits } = await props({
      slots: getSlots(),
      visits: getVisits()
    })

    // If slot_length is zero, so users are able to book unlimited slot
    const slotsWithoutLength = slots.filter(({ slot_length }) => slot_length === null)
    slots = slots.filter(({ slot_length }) => slot_length)

    // Split existing time ranges by booked time units
    visits.forEach(({ visit_date }) => {
      let index = findIndex(
        slots,
        ({ start_at, end_at }) => visit_date >= start_at && visit_date < end_at
      )
      // If found time range, split in
      if (index !== -1) {
        const slot = slots[index]
        slots.splice(index, 1)
        if (slot.start_at < visit_date) {
          const newItem = {
            start_at: slot.start_at,
            end_at: visit_date,
            slot_length: slot.slot_length
          }
          slots = [...slots.slice(0, index), newItem, ...slots.slice(index, 500)]
          index += 1
        }
        if (visit_date + slot.slot_length * 60 < slot.end_at) {
          const newItem = {
            start_at: visit_date + slot.slot_length * 60,
            end_at: slot.end_at,
            slot_length: slot.slot_length
          }
          slots = [...slots.slice(0, index), newItem, ...slots.slice(index, 500)]
        }
      }
    })

    const combinedSlots = [...slots, ...slotsWithoutLength]

    // Split slot ranges by slot units
    let result = {}
    combinedSlots.forEach((s) => {
      const day = moment.utc(s.start_at, 'X').startOf('day').format('X')
      // if slot_length is null, so show only 1 slot for date range
      const step = s.slot_length ? s.slot_length * 60 : s.end_at - s.start_at
      const items = range(s.start_at, s.end_at, step)
      items.forEach((i) => {
        const items = [...get(result, day, []), { from: i, to: i + step }]
        result = { ...result, [day]: items }
      })
    })

    return result
  }

  static async removeSlot(slot, trx) {
    // The landlord can't remove the slot if it is already started
    if (slot.start_at < moment.utc(new Date(), DATE_FORMAT)) {
      throw new HttpException(SHOW_ALREADY_STARTED, 400, SHOW_ALREADY_STARTED_ERROR_CODE)
    }

    // If slot's end date is passed, we only delete the slot
    // But if slot's end date is not passed, we delete the slot and all the visits

    try {
      if (slot.end_at < new Date()) {
        await TimeSlot.query().where('id', slot.id).delete().transacting(trx)
      } else {
        const estateId = slot.estate_id
        const userIds = await require('./MatchService').handleDeletedTimeSlotVisits(slot, trx)
        await TimeSlot.query().where('id', slot.id).delete().transacting(trx)
        let idx = 0
        while (idx < userIds.length) {
          await NoticeService.cancelVisit(estateId, userIds[idx])
          idx++
        }
      }
      await require('./EstateService').updatePercentAndIsPublished(
        {
          estate_id: slot.estate_id,
          deleted_slots_ids: [slot.id]
        },
        trx
      )
    } catch (e) {
      Logger.error(e)
      throw new HttpException(e.message, e.status || 400, e.code || 0)
    }
  }

  static async removeSlotMany(user_id, slot_id) {
    const EstateService = require('./EstateService')
    const trx = await Database.beginTransaction()
    try {
      const slot = await this.getTimeSlotByOwner(user_id, slot_id)
      if (!slot) {
        throw new HttpException(TIME_SLOT_NOT_FOUND, 404)
      }

      const estate_ids = await EstateService.getEstateIdsInBuilding(slot.estate_id)
      const slots = await this.getSameTimeSlotInBuilding({
        estateId: estate_ids,
        start_at: moment(slot.start_at).format(DATE_FORMAT),
        end_at: moment(slot.end_at).format(DATE_FORMAT)
      })

      await Promise.map(slots, async (slot) => {
        await TimeSlotService.removeSlot(slot, trx)
      })

      await trx.commit()
      return true
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400, e.code || 0)
    }
  }

  static async getSameTimeSlotInBuilding({ estateId, start_at, end_at }) {
    return (
      await TimeSlot.query()
        .whereIn('estate_id', Array.isArray(estateId) ? estateId : [estateId])
        .where('start_at', start_at)
        .where('end_at', end_at)
        .fetch()
    ).toJSON()
  }
}

module.exports = TimeSlotService
