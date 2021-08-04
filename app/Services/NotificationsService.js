'use strict'

const { uniqueId, isEmpty, isFunction, isArray, uniq, groupBy, get } = require('lodash')
const P = require('bluebird')
const md5 = require('md5')

/** @type {typeof import('/providers/Notifications')} */
const Notifications = use('Notifications')
const l = use('Localize')
const UserService = use('App/Services/UserService')
const uTime = require('moment')().format('X')

const { capitalize } = require('../Libs/utils')

const {
  NOTICE_TYPE_LANDLORD_QUESTION,
  NOTICE_TYPE_LANDLORD_FILL_PROFILE,
  NOTICE_TYPE_LANDLORD_NEW_PROPERTY,
  NOTICE_TYPE_LANDLORD_TIME_FINISHED,
  NOTICE_TYPE_LANDLORD_CONFIRM_VISIT,
  NOTICE_TYPE_LANDLORD_RECONFIRMED,
  NOTICE_TYPE_LANDLORD_VISIT_STARTING,
  NOTICE_TYPE_LANDLORD_MATCH,
  NOTICE_TYPE_LANDLORD_DECISION,
  NOTICE_TYPE_PROSPECT_QUESTION,
  NOTICE_TYPE_PROSPECT_MENTION,
  NOTICE_TYPE_PROSPECT_NEW_MATCH,
  NOTICE_TYPE_PROSPECT_MATCH_LEFT,
  NOTICE_TYPE_PROSPECT_INVITE,
  NOTICE_TYPE_PROSPECT_VISIT3H,
  NOTICE_TYPE_PROSPECT_VISIT30M,
  NOTICE_TYPE_PROSPECT_COMMIT,
  NOTICE_TYPE_CONFIRM_QUESTION,

  NOTICE_TYPE_LANDLORD_QUESTION_ID,
  NOTICE_TYPE_LANDLORD_FILL_PROFILE_ID,
  NOTICE_TYPE_LANDLORD_NEW_PROPERTY_ID,
  NOTICE_TYPE_LANDLORD_TIME_FINISHED_ID,
  NOTICE_TYPE_LANDLORD_CONFIRM_VISIT_ID,
  NOTICE_TYPE_LANDLORD_RECONFIRMED_ID,
  NOTICE_TYPE_LANDLORD_VISIT_STARTING_ID,
  NOTICE_TYPE_LANDLORD_MATCH_ID,
  NOTICE_TYPE_LANDLORD_DECISION_ID,
  NOTICE_TYPE_PROSPECT_QUESTION_ID,
  NOTICE_TYPE_PROSPECT_MENTION_ID,
  NOTICE_TYPE_PROSPECT_NEW_MATCH_ID,
  NOTICE_TYPE_PROSPECT_MATCH_LEFT_ID,
  NOTICE_TYPE_PROSPECT_INVITE_ID,
  NOTICE_TYPE_PROSPECT_VISIT3H_ID,
  NOTICE_TYPE_PROSPECT_VISIT30M_ID,
  NOTICE_TYPE_PROSPECT_COMMIT_ID,
  NOTICE_TYPE_CONFIRM_QUESTION_ID,

  NOTICE_TYPE_PROSPECT_NO_ACTIVITY,
  NOTICE_TYPE_PROSPECT_NO_ACTIVITY_ID,
  NOTICE_TYPE_PROSPECT_VISIT90M,
  NOTICE_TYPE_LANDLORD_VISIT90M,
  NOTICE_TYPE_PROSPECT_VISIT90M_ID,
  NOTICE_TYPE_LANDLORD_VISIT90M_ID,
  NOTICE_TYPE_PROSPECT_REJECT,
  NOTICE_TYPE_PROSPECT_REJECT_ID,
  NOTICE_TYPE_PROSPECT_PROFILE_EXPIRE,
  NOTICE_TYPE_PROSPECT_PROFILE_EXPIRE_ID,
} = require('../constants')

class NotificationsService {
  static async sendRaw(tokens, options) {
    return Notifications.send(tokens, options)
  }

  /**
   *
   */
  static getTypeById(typeId) {
    switch (typeId) {
      case NOTICE_TYPE_LANDLORD_QUESTION_ID:
        return NOTICE_TYPE_LANDLORD_QUESTION
      case NOTICE_TYPE_LANDLORD_FILL_PROFILE_ID:
        return NOTICE_TYPE_LANDLORD_FILL_PROFILE
      case NOTICE_TYPE_LANDLORD_NEW_PROPERTY_ID:
        return NOTICE_TYPE_LANDLORD_NEW_PROPERTY
      case NOTICE_TYPE_LANDLORD_TIME_FINISHED_ID:
        return NOTICE_TYPE_LANDLORD_TIME_FINISHED
      case NOTICE_TYPE_LANDLORD_CONFIRM_VISIT_ID:
        return NOTICE_TYPE_LANDLORD_CONFIRM_VISIT
      case NOTICE_TYPE_LANDLORD_RECONFIRMED_ID:
        return NOTICE_TYPE_LANDLORD_RECONFIRMED
      case NOTICE_TYPE_LANDLORD_VISIT_STARTING_ID:
        return NOTICE_TYPE_LANDLORD_VISIT_STARTING
      case NOTICE_TYPE_LANDLORD_MATCH_ID:
        return NOTICE_TYPE_LANDLORD_MATCH
      case NOTICE_TYPE_LANDLORD_DECISION_ID:
        return NOTICE_TYPE_LANDLORD_DECISION
      case NOTICE_TYPE_PROSPECT_QUESTION_ID:
        return NOTICE_TYPE_PROSPECT_QUESTION
      case NOTICE_TYPE_PROSPECT_MENTION_ID:
        return NOTICE_TYPE_PROSPECT_MENTION
      case NOTICE_TYPE_PROSPECT_NEW_MATCH_ID:
        return NOTICE_TYPE_PROSPECT_NEW_MATCH
      case NOTICE_TYPE_PROSPECT_MATCH_LEFT_ID:
        return NOTICE_TYPE_PROSPECT_MATCH_LEFT
      case NOTICE_TYPE_PROSPECT_INVITE_ID:
        return NOTICE_TYPE_PROSPECT_INVITE
      case NOTICE_TYPE_PROSPECT_VISIT3H_ID:
        return NOTICE_TYPE_PROSPECT_VISIT3H
      case NOTICE_TYPE_PROSPECT_VISIT30M_ID:
        return NOTICE_TYPE_PROSPECT_VISIT30M
      case NOTICE_TYPE_PROSPECT_COMMIT_ID:
        return NOTICE_TYPE_PROSPECT_COMMIT
      case NOTICE_TYPE_CONFIRM_QUESTION_ID:
        return NOTICE_TYPE_CONFIRM_QUESTION
      case NOTICE_TYPE_PROSPECT_NO_ACTIVITY_ID:
        return NOTICE_TYPE_PROSPECT_NO_ACTIVITY
      case NOTICE_TYPE_PROSPECT_VISIT90M_ID:
        return NOTICE_TYPE_PROSPECT_VISIT90M
      case NOTICE_TYPE_LANDLORD_VISIT90M_ID:
        return NOTICE_TYPE_LANDLORD_VISIT90M
      case NOTICE_TYPE_PROSPECT_REJECT_ID:
        return NOTICE_TYPE_PROSPECT_REJECT
    }
  }

  /**
   * Send notification and add job for deferred send
   */
  static async sendNotification(tokens, type, { body, data, title = '' }) {
    // send deferred
    const options = {
      notification: {
        title: title || body,
        body: body || title,
      },
      data: {
        type,
        messageId: uniqueId(`m_${uTime}_`),
        body,
        title,
        payload: isEmpty(data) ? '' : JSON.stringify(data),
      },
    }

    return NotificationsService.sendRaw(tokens, options)
  }

  /**
   *
   */
  static async send(tokens, type, message, data, title) {
    return NotificationsService.sendNotification(tokens, type, {
      body: message,
      title: title || message,
      data: {
        payload: data,
      },
    })
  }

  /**
   * notification_landlord_new_property
   */
  static async sendLandlordNewProperty(notices) {
    const title = 'landlord.notification.event.no_prop_profile'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        l.get('landlord.notification.tip.no_prop_profile', lang) +
        ' \n' +
        l.get('landlord.notification.next.no_prop_profile', lang)
      )
    })
  }

  /**
   *
   */
  static async sendLandlordNoProfile(notices) {
    const title = 'landlord.notification.event.no_ll_profile'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        l.get('landlord.notification.tip.no_ll_profile', lang) +
        ' \n' +
        l.get('landlord.notification.next.no_ll_profile', lang)
      )
    })
  }

  /**
   *
   */
  static async sendLandlordNoProperty(notices = []) {
    const title = 'notification_landlord_fill_property'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        l.get('landlord.notification.tip.no_prop_profile', lang) +
        ' \n' +
        l.get('landlord.notification.next.no_prop_profile', lang)
      )
    })
  }

  /**
   * Send Notification about estate expired soon
   */
  static async sendEstateExpired(notices) {
    const title = 'landlord.notification.event.limit_expired'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      const address = capitalize(get(data, 'estate_address', ''))
      return address + ' \n' + l.get('landlord.notification.next.limit_expired', lang)
    })
  }

  /**
   *
   */
  static async sendLandlordSlotsSelected(notices) {
    const title = 'landlord.notification.event.slots_selected'
    const subBody = 'landlord.notification.next.slots_selected'

    return NotificationsService.sendNotes(
      notices,
      (data, lang) => {
        const total = get(data, 'total', '10')
        return `${total}/${total} ${l.get(title, lang)}`
      },
      (data, lang) => {
        const address = capitalize(get(data, 'estate_address', ''))
        return address + ' \n' + l.get(subBody, lang)
      }
    )
  }

  /**
   *
   */
  static async sendLandlordVisitsConfirmed(userId, { estate_id, estate_address }) {
    // TODO: Need review business logic
  }

  /**
   *
   */
  static async sendLandlordGetFinalMatch(notes) {
    const title = 'landlord.notification.event.final_match'

    return NotificationsService.sendNotes(notes, title, (data, lang) => {
      const address = capitalize(get(data, 'estate_address', ''))
      return address + ' \n' + l.get('landlord.notification.next.final_match', lang)
    })
  }

  /**
   * Send message for landlord, user choose another apt
   */
  static async sendLandlordFinalMatchRejected(notices) {
    const title = 'landlord.notification.event.final_match_rejected'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      const address = capitalize(get(data, 'estate_address', ''))
      return address + ' \n' + l.get('landlord.notification.next.final_match_rejected', lang)
    })
  }

  /**
   * Sent notifications from Note entity
   */
  static async sendNotes(notes, title, body) {
    if (!isArray(notes) || isEmpty(notes)) {
      return false
    }

    // Users tokens and lang
    const langTokens = await UserService.getTokenWithLocale(uniq(notes.map((i) => i.user_id)))
    // Mixin token data to existing data
    notes = notes.reduce((n, i) => {
      const token = langTokens.find(({ id, lang, device_token }) => +id === +i.user_id)
      if (!token) {
        return n
      }
      return [...n, { ...i, lang: token.lang, device_token: token.device_token }]
    }, [])

    // Group bu uniq params
    const items = groupBy(notes, (i) => {
      return md5(String(i.type + JSON.stringify(i.data) + i.lang).replace(/\s/g, ''))
    })

    // Send user notifications
    return P.map(Object.values(items), (v) => {
      const tokens = v.map((i) => i.device_token)
      const lang = get(v, '0.lang')
      const data = get(v, '0.data', {})
      const typeId = get(v, '0.type')

      try {
        return NotificationsService.sendNotification(
          tokens,
          NotificationsService.getTypeById(typeId),
          {
            title: isFunction(title) ? title(data, lang) : l.get(title, lang),
            body: isFunction(body) ? body(data, lang) : l.get(body, lang),
            data,
          }
        )
      } catch (e) {
        console.log(e)
      }
    })
  }

  /**
   *
   */
  static async sendProspectNoActivity(notices) {
    const title = 'prospect.notification.event.no_activity'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        l.get('prospect.notification.tip.no_activity', lang) +
        ' \n' +
        l.get('prospect.notification.next.no_activity', lang)
      )
    })
  }

  /**
   *
   */
  static async sendProspectNewMatch(notices) {
    const title = l.get('prospect.notification.event.new_match')

    return NotificationsService.sendNotes(
      notices,
      (data, lang) => `${data.match_count} ${l.get(title, lang)}`,
      (data, lang) => {
        return (
          l.get('prospect.notification.tip.new_match', lang) +
          ' \n' +
          l.get('prospect.notification.next.new_match', lang)
        )
      }
    )
  }

  /**
   *
   */
  static async sendProspectEstateExpiring(notices) {
    const title = 'prospect.notification.event.knock_limit_expiring'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.next.knock_limit_expiring', lang)
      )
    })
  }

  /**
   *
   */
  static async sendProspectNewInvite(notice) {
    const title = 'prospect.notification.event.new_invite'

    return NotificationsService.sendNotes([notice], title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.next.new_invite', lang)
      )
    })
  }

  /**
   *
   */
  static async sendProspectFirstVisitConfirm(notices) {
    const title = 'prospect.notification.event.confirm_visit_in'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.next.confirm_visit_in', lang)
      )
    })
  }

  /**
   *
   */
  static async sendProspectVisit90m(notices) {
    const title = 'prospect.notification.event.visit_in'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) + ' \n' + l.get('prospect.notification.next.visit_in', lang)
      )
    })
  }

  /**
   *
   */
  static async sendLandlordVisit90m(notices) {
    const title = 'landlord.notification.event.visit_starting_in'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('landlord.notification.next.visit_starting_in', lang)
      )
    })
  }

  /**
   *
   */
  static async sendProspectLandlordConfirmed(notice) {
    const title = 'prospect.notification.event.commit'

    return NotificationsService.sendNotes([notice], title, (data, lang) => {
      return (
        capitalize(data.estate_address) + ' \n' + l.get('prospect.notification.next.commit', lang)
      )
    })
  }

  /**
   * When another user got final confirm request and accept it, another
   */
  static async sendProspectEstatesRentAnother(notices) {
    const title = 'prospect.notification.event.prospect_rejected'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.next.prospect_rejected', lang)
      )
    })
  }

  /**
   *
   */
  static async sendProspectProfileExpiring(notices) {
    const title = 'prospect.notification.event.profile_expiring'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        l.get('prospect.notification.tip.profile_expiring', lang) +
        ' \n' +
        l.get('prospect.notification.next.profile_expiring', lang)
      )
    })
  }

  /**
   *
   */
  static async sendProspectFinalVisitConfirm(notices) {
    const title = 'prospect.notification.event.visit_status'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.tip.visit_status', lang)
      )
    })
  }

  /**
   *
   */
  static async sendLandlordVisitIn30m(notices) {
    const title = 'landlord.notification.event.visit_status'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('landlord.notification.next.visit_status', lang)
      )
    })
  }
}

module.exports = NotificationsService
