'use strict'

const FeatureService = use('App/Services/FeatureService')
const { YEARLY_DISCOUNT_RATE } = require('../../constants')

class FeatureController {
  async getFeatures({ request, response }) {
    const { limit, page, ...params } = request.all()
    const features = await FeatureService.getFeatures(params);
    const data = {
      year_discount_rate:YEARLY_DISCOUNT_RATE,
      features:features
    }
    return response.res(data)
  }

  async createFeature({ request, response }) {
    const data = request.all()
    const result = await FeatureService.createFeature(data)
    return response.res(result)
  }

  async updateFeature({ request, response }) {
    const data = request.all()
    const result = await FeatureService.updateFeature(data)
    return response.res(result)
  }

  async removeFeature({ request, response }) {
    const { ids } = request.all()
    FeatureService.removeFeature(ids);
    return response.res(true)
  }
}

module.exports = FeatureController
