'use strict'

const { STATUS_DELETE, STATUS_DRAFT } = require('../constants')

const Contract = use('App/Models/Contract')

class ContractService {
  static async createContract(data, trx) {
    await Contract.createItem(data, trx)
    /*TODO: 
      - create order
      - create bills for that order
      - update order 
    */
  }

  static async updateConract({ contract_id, status }, trx) {
    return await Contract.query()
      .where('contract_id', contract_id)
      .update({ status })
      .transacting(trx)
  }

  static async getContractByUser(user_id) {
    return await Contract.query()
      .where('user_id', user_id)
      .whereNotIn('status', [STATUS_DELETE, STATUS_DRAFT])
      .first()
  }

  static async getContractBySubcription(subscription_id) {
    return await Contract.query()
      .where('subscription_id', subscription_id)
      .whereNotIn('status', [STATUS_DELETE])
      .first()
  }
}

module.exports = ContractService
