'use strict'

const LandlordListener = (exports = module.exports = {})
const Estate = use('App/Models/Estate')
const User = use('App/Models/User')
const { STATUS_ACTIVE, STATUS_DRAFT, STATUS_EXPIRE } = require('../constants')
const NotificationsService = use('App/Services/NotificationsService')

LandlordListener.deactivate = async (userIds) => {
  await Estate.query()
    .whereIn('user_id', userIds)
    .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
    .update({ status: STATUS_DRAFT })

  await Promise.map(userIds, async (id) => {
    const user = await User.query().select('device_token', 'lang').where('id', id).first()
    if (user.device_token) {
      await NotificationsService.sendNotification(
        [user.device_token],
        NOTICE_TYPE_LANDLORD_DEACTIVATE_NOW,
        {
          title: l.get(
            'landlord.notification.event.profile_deactivated_now',
            user.lang || DEFAULT_LANG
          ),
          body: l.get(
            'landlord.notification.event.profile_deactivated_now.next.message',
            user.lang || DEFAULT_LANG
          ),
        }
      )
    }
  })
}
