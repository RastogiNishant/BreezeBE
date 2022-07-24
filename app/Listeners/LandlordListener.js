'use strict'

const LandlordListener = (exports = module.exports = {})
const Estate = require('App/Models/Estate')
const { STATUS_ACTIVE, STATUS_DRAFT } = require('../constants')

LandlordListener.deactivate = async (userIds) => {
  await Estate.query()
    .whereIn('user_id', userIds)
    .where('status', STATUS_ACTIVE)
    .update({ status: STATUS_DRAFT })
}
