'use strict'

const FeatureService = use('App/Services/FeatureService')
class FeatureController {
  async getFeatures({ request, response }) {
    const result = await FeatureService.getFeatures();
    return response.res(result)
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
