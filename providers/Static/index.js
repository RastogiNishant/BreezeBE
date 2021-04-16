'use strict'

const Promise = require('bluebird')
const { isEmpty } = require('lodash')

const convertToJSON = async (method) => {
  const res = await method()
  return isEmpty(res) ? null : res.toJSON()
}

class Static {
  constructor() {
    this._data = {}
  }

  async loadData() {
    const AgreementService = use('App/Services/AgreementService')

    return Promise.props({
      agreement: convertToJSON(AgreementService.getLatestActive),
      terms: convertToJSON(AgreementService.getActiveTerms),
    })
  }

  async init() {
    this._data = await this.loadData()
  }

  getData() {
    return this._data
  }
}

module.exports = Static
