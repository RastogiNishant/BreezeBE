'use strict'

const { uniqueId, isEmpty, isFunction, isArray, uniq, groupBy, get } = require('lodash')
const P = require('bluebird')
const md5 = require('md5')

/** @type {typeof import('/providers/Notifications')} */
const Notifications = use('Notifications')
const l = use('Localize')
const UserService = use('App/Services/UserService')
const uTime = require('moment')().format('X')

const { capitalize, rc } = require('../Libs/utils')

const {
  NOTICE_TYPE_LANDLORD_FILL_PROFILE,
  NOTICE_TYPE_LANDLORD_NEW_PROPERTY,
  NOTICE_TYPE_LANDLORD_TIME_FINISHED,
  NOTICE_TYPE_LANDLORD_CONFIRM_VISIT,
  NOTICE_TYPE_LANDLORD_VISIT30M,
  NOTICE_TYPE_LANDLORD_MATCH,
  NOTICE_TYPE_LANDLORD_DECISION,
  NOTICE_TYPE_PROSPECT_NEW_MATCH,
  NOTICE_TYPE_PROSPECT_MATCH_LEFT,
  NOTICE_TYPE_PROSPECT_INVITE,
  NOTICE_TYPE_PROSPECT_VISIT3H,
  NOTICE_TYPE_PROSPECT_VISIT30M,
  NOTICE_TYPE_PROSPECT_COMMIT,
  NOTICE_TYPE_PROSPECT_COME,
  NOTICE_TYPE_CANCEL_VISIT,
  NOTICE_TYPE_VISIT_DELAY,
  NOTICE_TYPE_VISIT_DELAY_LANDLORD,
  NOTICE_TYPE_ZENDESK_NOTIFY,

  NOTICE_TYPE_LANDLORD_FILL_PROFILE_ID,
  NOTICE_TYPE_LANDLORD_NEW_PROPERTY_ID,
  NOTICE_TYPE_LANDLORD_TIME_FINISHED_ID,
  NOTICE_TYPE_LANDLORD_CONFIRM_VISIT_ID,
  NOTICE_TYPE_LANDLORD_VISIT30M_ID,
  NOTICE_TYPE_LANDLORD_MATCH_ID,
  NOTICE_TYPE_LANDLORD_DECISION_ID,
  NOTICE_TYPE_PROSPECT_NEW_MATCH_ID,
  NOTICE_TYPE_PROSPECT_MATCH_LEFT_ID,
  NOTICE_TYPE_PROSPECT_INVITE_ID,
  NOTICE_TYPE_PROSPECT_VISIT3H_ID,
  NOTICE_TYPE_PROSPECT_VISIT30M_ID,
  NOTICE_TYPE_PROSPECT_COMMIT_ID,

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
  NOTICE_TYPE_PROSPECT_COME_ID,
  NOTICE_TYPE_VISIT_DELAY_ID,
  NOTICE_TYPE_VISIT_DELAY_LANDLORD_ID,
  NOTICE_TYPE_CANCEL_VISIT_ID,
  NOTICE_TYPE_ZENDESK_NOTIFY_ID,
  NOTICE_TYPE_USER_VERIFICATION_BY_ADMIN_ID,
  NOTICE_TYPE_USER_VERIFICATION_BY_ADMIN,
  NOTICE_TYPE_PROSPECT_IS_NOT_INTERESTED_ID,
  NOTICE_TYPE_PROSPECT_IS_NOT_INTERESTED,
  NOTICE_TYPE_LANDLORD_MOVED_PROSPECT_TO_TOP_ID,
  NOTICE_TYPE_LANDLORD_MOVED_PROSPECT_TO_TOP,
  NOTICE_TYPE_PROSPECT_HOUSEHOLD_INVITATION_ACCEPTED,
  NOTICE_TYPE_PROSPECT_HOUSEHOLD_INVITATION_ACCEPTED_ID,
  NOTICE_TYPE_PROSPECT_HOUSEHOLD_DISCONNECTED,
  NOTICE_TYPE_PROSPECT_HOUSEHOLD_DISCONNECTED_ID,
  NOTICE_TYPE_ESTATE_SHOW_TIME_IS_OVER,
  NOTICE_TYPE_ESTATE_SHOW_TIME_IS_OVER_ID,
  NOTICE_TYPE_PROSPECT_INVITE_REMINDER_ID,
  NOTICE_TYPE_PROSPECT_INVITE_REMINDER,
  NOTICE_TYPE_INVITE_TENANT_IN_TO_VISIT_ID,
  NOTICE_TYPE_INVITE_TENANT_IN_TO_VISIT,
  NOTICE_TYPE_CANCEL_VISIT_LANDLORD_ID,
  NOTICE_TYPE_CANCEL_VISIT_LANDLORD,
  NOTICE_TYPE_PROSPECT_ARRIVED_ID,
  NOTICE_TYPE_PROSPECT_ARRIVED,
  NOTICE_TYPE_PROSPECT_PROPERTY_DEACTIVATED_ID,
  NOTICE_TYPE_PROSPECT_PROPERTY_DEACTIVATED,
  NOTICE_TYPE_PROSPECT_SUPER_MATCH_ID,
  NOTICE_TYPE_PROSPECT_SUPER_MATCH,
} = require('../constants')
const { lang } = require('moment')

const mapping = [
  [NOTICE_TYPE_LANDLORD_FILL_PROFILE_ID, NOTICE_TYPE_LANDLORD_FILL_PROFILE],
  [NOTICE_TYPE_LANDLORD_NEW_PROPERTY_ID, NOTICE_TYPE_LANDLORD_NEW_PROPERTY],
  [NOTICE_TYPE_LANDLORD_TIME_FINISHED_ID, NOTICE_TYPE_LANDLORD_TIME_FINISHED],
  [NOTICE_TYPE_LANDLORD_CONFIRM_VISIT_ID, NOTICE_TYPE_LANDLORD_CONFIRM_VISIT],
  [NOTICE_TYPE_LANDLORD_VISIT30M_ID, NOTICE_TYPE_LANDLORD_VISIT30M],
  [NOTICE_TYPE_LANDLORD_MATCH_ID, NOTICE_TYPE_LANDLORD_MATCH],
  [NOTICE_TYPE_LANDLORD_DECISION_ID, NOTICE_TYPE_LANDLORD_DECISION],
  [NOTICE_TYPE_PROSPECT_NEW_MATCH_ID, NOTICE_TYPE_PROSPECT_NEW_MATCH],
  [NOTICE_TYPE_PROSPECT_MATCH_LEFT_ID, NOTICE_TYPE_PROSPECT_MATCH_LEFT],
  [NOTICE_TYPE_PROSPECT_INVITE_ID, NOTICE_TYPE_PROSPECT_INVITE],
  [NOTICE_TYPE_PROSPECT_VISIT3H_ID, NOTICE_TYPE_PROSPECT_VISIT3H],
  [NOTICE_TYPE_PROSPECT_VISIT30M_ID, NOTICE_TYPE_PROSPECT_VISIT30M],
  [NOTICE_TYPE_PROSPECT_COMMIT_ID, NOTICE_TYPE_PROSPECT_COMMIT],
  [NOTICE_TYPE_PROSPECT_NO_ACTIVITY_ID, NOTICE_TYPE_PROSPECT_NO_ACTIVITY],
  [NOTICE_TYPE_PROSPECT_VISIT90M_ID, NOTICE_TYPE_PROSPECT_VISIT90M],
  [NOTICE_TYPE_LANDLORD_VISIT90M_ID, NOTICE_TYPE_LANDLORD_VISIT90M],
  [NOTICE_TYPE_PROSPECT_REJECT_ID, NOTICE_TYPE_PROSPECT_REJECT],
  [NOTICE_TYPE_PROSPECT_PROFILE_EXPIRE_ID, NOTICE_TYPE_PROSPECT_PROFILE_EXPIRE],
  [NOTICE_TYPE_PROSPECT_COME_ID, NOTICE_TYPE_PROSPECT_COME],
  [NOTICE_TYPE_CANCEL_VISIT_ID, NOTICE_TYPE_CANCEL_VISIT],
  [NOTICE_TYPE_CANCEL_VISIT_LANDLORD_ID, NOTICE_TYPE_CANCEL_VISIT_LANDLORD],
  [NOTICE_TYPE_INVITE_TENANT_IN_TO_VISIT_ID, NOTICE_TYPE_INVITE_TENANT_IN_TO_VISIT],
  [NOTICE_TYPE_USER_VERIFICATION_BY_ADMIN_ID, NOTICE_TYPE_USER_VERIFICATION_BY_ADMIN],
  [NOTICE_TYPE_ESTATE_SHOW_TIME_IS_OVER_ID, NOTICE_TYPE_ESTATE_SHOW_TIME_IS_OVER],
  [NOTICE_TYPE_PROSPECT_IS_NOT_INTERESTED_ID, NOTICE_TYPE_PROSPECT_IS_NOT_INTERESTED],
  [NOTICE_TYPE_LANDLORD_MOVED_PROSPECT_TO_TOP_ID, NOTICE_TYPE_LANDLORD_MOVED_PROSPECT_TO_TOP],
  [
    NOTICE_TYPE_PROSPECT_HOUSEHOLD_INVITATION_ACCEPTED_ID,
    NOTICE_TYPE_PROSPECT_HOUSEHOLD_INVITATION_ACCEPTED,
  ],
  [NOTICE_TYPE_PROSPECT_HOUSEHOLD_DISCONNECTED_ID, NOTICE_TYPE_PROSPECT_HOUSEHOLD_DISCONNECTED],
  [NOTICE_TYPE_PROSPECT_INVITE_REMINDER_ID, NOTICE_TYPE_PROSPECT_INVITE_REMINDER],
  [NOTICE_TYPE_VISIT_DELAY_ID, NOTICE_TYPE_VISIT_DELAY],
  [NOTICE_TYPE_VISIT_DELAY_LANDLORD_ID, NOTICE_TYPE_VISIT_DELAY_LANDLORD],
  [NOTICE_TYPE_ZENDESK_NOTIFY_ID, NOTICE_TYPE_ZENDESK_NOTIFY],
  [NOTICE_TYPE_PROSPECT_ARRIVED_ID, NOTICE_TYPE_PROSPECT_ARRIVED],
  [NOTICE_TYPE_PROSPECT_PROPERTY_DEACTIVATED_ID, NOTICE_TYPE_PROSPECT_PROPERTY_DEACTIVATED],
  [NOTICE_TYPE_PROSPECT_SUPER_MATCH_ID, NOTICE_TYPE_PROSPECT_SUPER_MATCH],
]

class NotificationsService {
  static async sendRaw(tokens, options) {
    return Notifications.send(tokens, options)
  }

  /**
   *
   */
  static getTypeById(typeId) {
    return get(
      mapping.find((i) => i[0] === typeId),
      '1'
    )
  }

  /**
   *
   */
  static getIdByType(typeId) {
    return get(
      mapping.find((i) => i[1] === typeId),
      '0'
    )
  }

  /**
   * Send notification and add job for deferred send
   */
  static async sendNotification(
    tokens,
    type,
    { body, data, title = '' },
    image = process.env.APP_LOGO
  ) {
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
    if (image) {
      options.notification.image = image
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
    const title = 'landlord.notification.event.unpublished_property'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return l.get('landlord.notification.next.unpublished_property.message', lang)
    })
  }

  /**
   *
   */
  static async sendLandlordNoProfile(notices) {
    const title = 'landlord.notification.event.no_ll_profile.message'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        l.get('landlord.notification.tip.no_ll_profile.message', lang) +
        ' \n' +
        l.get('landlord.notification.next.no_ll_profile.message', lang)
      )
    })
  }

  /**
   *
   */
  static async sendLandlordNoProperty(notices = []) {
    const title = 'landlord.notification.event.unpublished_property'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      let text = ''
      const address = capitalize(get(data, 'estate_address', ''))
      if (address) {
        text += address + ' \n'
      }
      text += l.get('landlord.notification.next.unpublished_property.message', lang)
      return text
    })
  }

  /**
   * Send Notification about estate expired soon
   */
  static async sendEstateExpired(notices) {
    const title = 'landlord.notification.event.limit_expired.message'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      const address = capitalize(get(data, 'estate_address', ''))
      return address + ' \n' + `${l.get('landlord.notification.next.limit_expired.message', lang)}`
    })
  }

  /**
   * Send Notification about estate expired soon
   */
  static async sendProspectPropertyDeactivated(notices) {
    const title = 'prospect.notification.event.prop_deactivated'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      const address = capitalize(get(data, 'estate_address', ''))
      return (
        address + ' \n' + `${l.get('prospect.notification.next.prop_deactivated.message', lang)}`
      )
    })
  }

  /**
   *
   */
  static async sendLandlordSlotsSelected(notices) {
    let title = 'landlord.notification.event.slots_selected.message'
    let subBody = 'landlord.notification.next.slots_selected.message'

    return NotificationsService.sendNotes(
      notices,
      (data, lang) => {
        const total = get(data, 'total', '10')
        title = `${title}.message`
        return `${total}/${total} ${l.get(title, lang)}`
      },
      (data, lang) => {
        const address = capitalize(get(data, 'estate_address', ''))
        return address + ' \n' + l.get(`${subBody}.message`, lang) + ` ${data.date}`
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
    const title = 'landlord.notification.event.final_match.message'

    return NotificationsService.sendNotes(notes, title, (data, lang) => {
      const address = capitalize(get(data, 'estate_address', ''))
      return address + ' \n' + l.get('landlord.notification.next.final_match.message', lang)
    })
  }

  /**
   * Send message for landlord, user choose another apt
   */
  static async sendLandlordFinalMatchRejected(notices) {
    const title = 'landlord.notification.event.final_match_rejected.message'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      const address = capitalize(get(data, 'estate_address', ''))
      return (
        address + ' \n' + l.get('landlord.notification.next.final_match_rejected.message', lang)
      )
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

    if (!items || !Object.values(items).length) {
      return
    }
    // Send user notifications
    return P.map(Object.values(items), (v) => {
      const tokens = v.map((i) => i.device_token)
      const lang = get(v, '0.lang')
      const data = get(v, '0.data', {})
      const typeId = get(v, '0.type')
      const image = get(v, '0.image')

      try {
        return NotificationsService.sendNotification(
          tokens,
          NotificationsService.getTypeById(typeId),
          {
            title: isFunction(title) ? title(data, lang) : l.get(`${title}`, lang),
            body: isFunction(body) ? body(data, lang) : l.get(`${body}`, lang),
            data,
          },
          image
        )
      } catch (e) {
        console.log('Notification error', e)
      }
    })
  }

  /**
   *
   */
  static async sendProspectNoActivity(notices) {
    const title = 'prospect.notification.event.no_activity.message'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return l.get('prospect.notification.next.no_activity.message', lang)
    })
  }

  /**
   *
   */
  static async sendProspectNewMatch(notices) {
    const title = l.get('prospect.notification.event.new_match.message')

    return NotificationsService.sendNotes(
      notices,
      (data, lang) => `${data.match_count} ${l.get(`${title}`, lang)}`,
      (data, lang) => {
        return l.get('prospect.notification.next.new_match.message', lang)
      }
    )
  }

  /**
   *
   */
  static async sendProspectEstateExpiring(notices) {
    const title = 'prospect.notification.event.knock_limit_expiring.message'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.next.knock_limit_expiring.message', lang)
      )
    })
  }

  /**
   *
   */
  static async sendProspectNewInvite(notice) {
    const title = 'prospect.notification.event.new_invite.message'

    return NotificationsService.sendNotes([notice], title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.next.new_invite.message', lang)
      )
    })
  }

  /**
   *  Notify the visit time delayed to landlord or prospect according to user_id
   */
  static async sendChangeVisitTimeProspect(notice) {
    return NotificationsService.sendNotes(
      notice,
      (data, lang) => {
        return `${data.user_name} ${rc(
          l.get('prospect.notification.event.coming_min_later', lang),
          [{ minutes: data.delay }]
        )}`
      },
      (data, lang) => {
        return (
          capitalize(data.estate_address) +
          ' \n' +
          l.get('prospect.notification.next.coming_min_later.message', lang)
        )
      }
    )
  }

  static async sendChangeVisitTimeLandlord(notice) {
    const title = 'notification.event.visit_delay'
    return NotificationsService.sendNotes(
      notice,
      (data, lang) => {
        return `${rc(l.get('prospect.notification.event.visit_delay', lang), [
          { minutes: data.delay },
        ])}`
      },
      (data, lang) => {
        return (
          capitalize(data.estate_address) +
          ' \n' +
          l.get('prospect.notification.next.visit_delay.message', lang)
        )
      }
    )
  }

  static async sendProspectArrived(notice) {
    return NotificationsService.sendNotes(
      notice,
      (data, lang) => {
        return `${data.user_name} ${(l.get('prospect.notification.event.arrived'), lang)}`
      },
      (data, lang) => {
        return (
          capitalize(data.estate_address) +
          ' \n' +
          l.get('prospect.notification.next.arrived.message', lang)
        )
      }
    )
  }

  /**
   * Notify to landlord that prospect cancels visit
   */
  static async sendProspectCancelVisit(notice) {
    return NotificationsService.sendNotes(
      notice,
      (data, lang) => {
        return `${data.user_name} ${
          (l.get('prospect.notification.event.cancelled_visit_by_prospect'), lang)
        }`
      },
      (data, lang) => {
        return (
          capitalize(data.estate_address) +
          ' \n' +
          l.get('prospect.notification.next.cancelled_visit_by_prospect.message', lang)
        )
      }
    )
  }

  /**
   * Notify to prospect that landlord cancels visit
   */
  static async sendLandlordCancelVisit(notice) {
    return NotificationsService.sendNotes(
      notice,
      (data, lang) => {
        return l.get('prospect.notification.event.cancelled_visit_by_landlord'), lang
      },
      (data, lang) => {
        return (
          capitalize(data.estate_address) +
          ' \n' +
          l.get('prospect.notification.next.cancelled_visit_by_landlord', lang)
        )
      }
    )
  }

  static async sendTenantInviteInToVisit(notice) {
    const title = 'prospect.notification.event.intive_in'
    return NotificationsService.sendNotes(notice, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.next.intive_in.message', lang)
      )
    })
  }

  //  static async sendProspectNewVisit(notice) {
  //   const title = 'prospect.notification.event.new_visit_time'
  //   return NotificationsService.sendNotes(notice, title, (data, lang) => {
  //     return (
  //       capitalize(data.estate_address) +
  //       ' \n' +
  //       l.get('prospect.notification.next.new_visit_time', lang)
  //     )
  //   })
  // }

  /**
   *
   */
  static async sendProspectFirstVisitConfirm(notices) {
    const title = 'prospect.notification.event.confirm_visit_in.message'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.next.confirm_visit_in.message', lang)
      )
    })
  }

  /**
   *
   */
  static async sendProspectVisit90m(notices) {
    const title = 'prospect.notification.event.visit_in.message'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.next.visit_in.message', lang)
      )
    })
  }

  /**
   *
   */
  static async sendLandlordVisit90m(notices) {
    const title = 'landlord.notification.event.visit_starting_in.message'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('landlord.notification.next.visit_starting_in.message', lang)
      )
    })
  }

  /**
   *
   */
  static async sendProspectLandlordConfirmed(notice) {
    const title = 'prospect.notification.event.commit.message'

    return NotificationsService.sendNotes([notice], title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.next.commit.message', lang)
      )
    })
  }

  /**
   *
   */
  static async sendProspectHasSuperMatch(notice) {
    const title = 'prospect.notification.event.best_match'

    return NotificationsService.sendNotes([notice], title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.next.best_match.message', lang)
      )
    })
  }

  /**
   * When another user got final confirm request and accept it, another
   */
  static async sendProspectEstatesRentAnother(notices) {
    const title = 'prospect.notification.event.landlord_rejected'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.next.landlord_rejected', lang)
      )
    })
  }

  /**
   *
   */
  static async sendProspectProfileExpiring(notices) {
    const title = 'prospect.notification.event.profile_expiring.message'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return l.get('prospect.notification.next.profile_expiring.message', lang)
    })
  }

  /**
   *
   */
  static async sendProspectFinalVisitConfirm(notices) {
    const title = 'prospect.notification.event.visit_status.message'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.next.visit_status.message', lang)
      )
    })
  }

  /**
   *
   */
  static async sendLandlordVisitIn30m(notices) {
    const title = 'landlord.notification.event.visit_status.message'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('landlord.notification.next.visit_status.message', lang)
      )
    })
  }

  /**
   *
   */
  static async sendProspectInviteToCome(notices) {
    const title = 'prospect.notification.event.come.message'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.next.come.message', lang)
      )
    })
  }

  static async sendLandlordIsVerifiedByAdmin(notices) {
    const title = 'landlord.notification.event.profile_activated'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return l.get('landlord.notification.next.profile_activated', lang)
    })
  }

  static async sendLandlordEstateShowDateIsEnded(notices) {
    const title = 'landlord.notification.event.show_over'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('landlord.notification.next.show_over.message', lang)
      )
    })
  }

  static async sendProspectWillLoseBookingTimeSlotChance(notices) {
    const title = 'prospect.notification.event.invite_reminder'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.next.invite_reminder.message', lang)
      )
    })
  }

  static async sendProspectIsNotInterested(notices) {
    const title = 'landlord.notification.event.prospect_unshared_profile'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('landlord.notification.next.prospect_unshared_profile.message', lang)
      )
    })
  }

  static async sendLandlordMovedProspectToTop(notices) {
    const title = 'prospect.notification.event.moved_to_top'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return (
        capitalize(data.estate_address) +
        ' \n' +
        l.get('prospect.notification.next.moved_to_top.message', lang)
      )
    })
  }

  static async sendProspectHouseholdInvitationAccepted(notices) {
    const title = 'prospect.notification.event.fellow_accepted'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return l.get('prospect.notification.next.fellow_accepted.message', lang)
    })
  }

  static async sendProspectHouseholdDisconnected(notices) {
    const title = 'prospect.notification.event.fellow_disconnected'

    return NotificationsService.sendNotes(notices, title, (data, lang) => {
      return l.get('prospect.notification.next.fellow_disconnected.message', lang)
    })
  }

  static async sendZendeskNotification(notices, title, body) {
    return NotificationsService.sendNotes(notices, title, body)
  }
}

module.exports = NotificationsService
