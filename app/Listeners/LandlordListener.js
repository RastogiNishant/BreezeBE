'use strict'

const LandlordListener = (exports = module.exports = {})
const Estate = use('App/Models/Estate')
const { STATUS_ACTIVE, STATUS_DRAFT, STATUS_EXPIRE } = require('../constants')
const NoticeService = use('App/Services/NoticeService')

LandlordListener.deactivate = async (userIds) => {
  await Estate.query()
    .whereIn('user_id', userIds)
    .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
    .update({ status: STATUS_DRAFT })

  await NoticeService.landlordsDeactivated(userIds)
}
