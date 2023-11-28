import * as moment from 'moment'

import * as MailService from './MailService'
import { APP_ROLES, USER_STATUS } from '../constants'

enum DEACTIVATION_TYPE {
  ACTION_DEACTIVATE = 1,
  ACTION_DELETE = 2
}

// in which timeframe the account should be closed
const DELETE_INACTIVE_PROSPECTS_IN_MONTHS = 6
// how long before deletion we start to notify the user
const FIRST_REMINDER_OFFSET_IN_DAYS = 14
// wait x days until the next step is activated
const INACTIVE_PROSPECTS_WAIT_PERIOD_IN_DAYS = 7

const UserService = use('App/Services/UserService')
const User = use('App/Models/User')
const UserDeactivationSchedule = use('App/Models/UserDeactivationSchedule')

const Database = use('Database')
const Logger = use('Logger')

const _internalHelper = {
  async processFirstReminder ({ id, email, lang }): Promise<void> {
    const timeToNextStep = moment()
      .utc()
      .add(INACTIVE_PROSPECTS_WAIT_PERIOD_IN_DAYS, 'days')
      .format()

    // if user reminder failes db transaction is rolled back
    await Database.transaction(async (trx) => {
      await UserDeactivationSchedule.query().transacting(trx).insert({
        user_id: id,
        deactivate_schedule: timeToNextStep,
        type: DEACTIVATION_TYPE.ACTION_DEACTIVATE,
        created_at: moment().utc().format()
      })

      // send the first email reminder (2 week before deletion)
      await MailService.sendToProspectForAccountInactivityFirstReminder({
        email,
        lang
      })
    })
  },
  async processSecondReminder ({ id, email, lang }): Promise<void> {
    const timeToNextStep = moment()
      .utc()
      .add(INACTIVE_PROSPECTS_WAIT_PERIOD_IN_DAYS, 'days')
      .format()

    // if email reminder failes db transaction is rolled back
    await Database.transaction(async (trx) => {
      await UserDeactivationSchedule.query()
        .transacting(trx)
        .where({ user_id: id, type: DEACTIVATION_TYPE.ACTION_DEACTIVATE })
        .update({ type: DEACTIVATION_TYPE.ACTION_DELETE, deactivate_schedule: timeToNextStep })

      // send the second email reminder (1 week before deletion)
      await MailService.sendToProspectForAccountInactivitySecondReminder({
        email,
        lang
      })
    })
  },
  async processUserDeletion ({ id, email, lang }): Promise<void> {
    // close account
    await UserService.closeAccount({ id, email })

    // clean up deactivation schedule
    await UserDeactivationSchedule.query().whereIn('user_id', [id]).delete()

    // send the account deletion info
    await MailService.sendToProspectForAccountDeletion({ email, lang })
  }
}

export const processDeletionSchedule = async (): Promise<void> => {
  // Calculate the date for the first email reminder (2 weeks before deletion)
  const firstReminderDate = moment()
    .utc()
    .subtract(DELETE_INACTIVE_PROSPECTS_IN_MONTHS, 'month')
    .add(FIRST_REMINDER_OFFSET_IN_DAYS, 'days')
    .format()

  // load inactive prospects
  // @TODO should move into the UserService
  const inactiveProspects = await User.query()
    .whereNot('status', USER_STATUS.DELETE)
    .where('users.updated_at', '<=', firstReminderDate)
    .where('role', APP_ROLES.USER)
    .leftJoin('user_deactivation_schedules as _uds', '_uds.user_id', 'users.id')
    .select(['*', 'users.id as id', '_uds.type as deactivate_type'])
    .fetch()

  const inactiveProspectsList: any[] =
    inactiveProspects.toJSON({ basicFields: true, publicOnly: false }) ?? []

  // filter for first reminders
  const prospectsForFirstReminder = inactiveProspectsList.filter(
    (prospect) => prospect.deactivate_schedule === null
  )
  Logger.info(
    `[UserDeletionService] Processing ${prospectsForFirstReminder.length} prospects for first reminder`
  )
  for (const prospect of prospectsForFirstReminder) {
    try {
      await _internalHelper.processFirstReminder(prospect)
    } catch {}
  }

  // filter for second reminder
  const prospectsForSecondReminder = inactiveProspectsList.filter(
    (prospect) =>
      prospect.deactivate_type === DEACTIVATION_TYPE.ACTION_DEACTIVATE &&
      moment().utc().isAfter(prospect.deactivate_schedule)
  )
  Logger.info(
    `[UserDeletionService] Processing ${prospectsForSecondReminder.length} prospects for second reminder`
  )
  for (const prospect of prospectsForSecondReminder) {
    try {
      await _internalHelper.processSecondReminder(prospect)
    } catch {}
  }

  // filter for deletion
  const prospectsForDeletionInfo = inactiveProspectsList.filter(
    (prospect) =>
      prospect.deactivate_type === DEACTIVATION_TYPE.ACTION_DELETE &&
      moment().utc().isAfter(prospect.deactivate_schedule)
  )
  Logger.info(
    `[UserDeletionService] Processing ${prospectsForDeletionInfo.length} prospects for deletion info`
  )
  for (const prospect of prospectsForDeletionInfo) {
    try {
      await _internalHelper.processUserDeletion(prospect)
    } catch {}
  }

  // clean up deletion schedule for users that have been active again
  const cleanScheduleFromReactivatedUsers = (await UserDeactivationSchedule.query()
    .whereNotIn(
      'user_id',
      inactiveProspectsList.map((prospect) => prospect.id)
    )
    .delete()) as number

  Logger.info(
    `[UserDeletionService] Deactivation schedules for ${cleanScheduleFromReactivatedUsers} users have been reset`
  )
}
