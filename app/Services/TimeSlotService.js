const { props } = require('bluebird')
const { range, findIndex, get } = require('lodash')
const moment = require('moment')
const { DATE_FORMAT } = require('../constants')
const AppException = use('App/Exceptions/AppException')
const HttpException = use('App/Exceptions/HttpException')
const Database = use('Database')
const Estate = use('App/Models/Estate')
const TimeSlot = use('App/Models/TimeSlot')
const NoticeService = use('App/Services/NoticeService')

const {
  exceptions: {
    INVALID_TIME_RANGE,
    TIME_SLOT_CROSSING_EXISTING,
    TIME_SLOT_NOT_FOUND,
    SHOW_ALREADY_STARTED,
  },
} = require('../excepions')
class TimeSlotService {
  static async createSlot({ end_at, start_at, slot_length }, estate) {
    TimeSlotService.validateTimeRange({ end_at, start_at, slot_length })

    // Checks is time slot crossing existing
    const existing = await this.getCrossTimeslotQuery({ end_at, start_at }, estate.user_id).first()

    if (existing) {
      throw new AppException(TIME_SLOT_CROSSING_EXISTING)
    }

    return TimeSlot.createItem({ end_at, start_at, slot_length, estate_id: estate.id })
  }

  static async updateTimeSlot(user_id, data) {
    const { estate_id, slot_id, ...rest } = data
    const slot = await this.getTimeSlotByOwner(user_id, slot_id)

    if (!slot) {
      throw new HttpException(TIME_SLOT_NOT_FOUND, 404)
    }

    const { slot_length, end_at, start_at } = slot.toJSON()

    const trx = await Database.beginTransaction()
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
          prev_end_at: updatedSlot.prev_end_at,
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
              end_at: rvAt.end_at,
            })) || []
          if (visitsIn && visitsIn.length) {
            visitIds = visitsIn.map((v) => v.user_id)
            await MatchService.handleMatchesOnTimeSlotUpdate(estate_id, visitIds, trx)
          }
        })
      )

      await trx.commit()

      const notifyUserIds = visitIds.concat(invitedUserIds || [])
      if (notifyUserIds && notifyUserIds.length) {
        NoticeService.updateTimeSlot(estate_id, notifyUserIds)
      }

      return updatedSlot
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 500)
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
      { end_at: slot.end_at, start_at: slot.start_at },
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

  static validateTimeRange({ start_at, end_at, slot_length }) {
    if (slot_length) {
      const minDiff = moment.utc(end_at).diff(moment.utc(start_at), 'minutes')
      if (minDiff % slot_length !== 0) {
        throw new AppException(INVALID_TIME_RANGE)
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

  static getCrossTimeslotQuery({ end_at, start_at }, userId) {
    return TimeSlot.query()
      .whereIn('estate_id', function () {
        this.select('id').from('estates').where('user_id', userId)
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
    const dateFrom = moment().format(DATE_FORMAT)
    // Get estate available slots
    const getSlots = async () => {
      return Database.table('time_slots')
        .select('slot_length')
        .select(Database.raw('extract(epoch from start_at) as start_at'))
        .select(Database.raw('extract(epoch from end_at) as end_at'))
        .where({ estate_id: estateId })
        .where('start_at', '>=', dateFrom)
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
      visits: getVisits(),
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
            slot_length: slot.slot_length,
          }
          slots = [...slots.slice(0, index), newItem, ...slots.slice(index, 500)]
          index += 1
        }
        if (visit_date + slot.slot_length * 60 < slot.end_at) {
          const newItem = {
            start_at: visit_date + slot.slot_length * 60,
            end_at: slot.end_at,
            slot_length: slot.slot_length,
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

  static async removeSlot(user_id, slot_id) {
    const slot = await TimeSlotService.getTimeSlotByOwner(user_id, slot_id)
    if (!slot) {
      throw new HttpException(TIME_SLOT_NOT_FOUND, 404)
    }

    // The landlord can't remove the slot if it is already started
    if (slot.start_at < moment.utc(new Date(), DATE_FORMAT)) {
      throw new HttpException(SHOW_ALREADY_STARTED)
    }

    // If slot's end date is passed, we only delete the slot
    // But if slot's end date is not passed, we delete the slot and all the visits
    if (slot.end_at < new Date()) {
      await slot.delete()
      return true
    } else {
      const trx = await Database.beginTransaction()
      try {
        const estateId = slot.estate_id
        const userIds = await MatchService.handleDeletedTimeSlotVisits(slot, trx)
        await slot.delete(trx)

        await trx.commit()

        const notificationPromises = userIds.map((userId) =>
          NoticeService.cancelVisit(estateId, userId)
        )
        await Promise.all(notificationPromises)
        return true
      } catch (e) {
        Logger.error(e)
        await trx.rollback()
        throw new HttpException(e.message, 400)
      }
    }
  }
}

module.exports = TimeSlotService
