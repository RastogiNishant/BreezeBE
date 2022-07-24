'use strict'

const LandlordListener = (exports = module.exports = {})
const Estate = require('App/Models/Estate')
const { STATUS_ACTIVE, STATUS_DRAFT } = require('../constants')

LandlordListener.deactivate = async (userId) => {
  await Estate.query()
    .where('user_id', userId)
    .where('status', STATUS_ACTIVE)
    .update({ status: STATUS_DRAFT })
}
