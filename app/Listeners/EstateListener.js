'use strict'

const EstateListener = (exports = module.exports = {})
const Estate = use('App/Models/Estate')

const { STATUS_ACTIVE, STATUS_DRAFT, STATUS_EXPIRE } = require('../constants')

EstateListener.changeEstate = async (estateId) => {
  await Estate.query()
    .where('id', estateId)
    .whereIn('status', [STATUS_EXPIRE, STATUS_ACTIVE])
    .update({ status: STATUS_DRAFT })
}
