const PremiumFeature = use('App/Models/PremiumFeature')
const HttpException = use('App/Exceptions/HttpException')

class FeatureService {
  static async getFeatures() {
    const query = PremiumFeature.query()
    const features = (await query.orderBy('id', 'desc').fetch()).rows
    return features
  }

  static async createFeature(data) {
    return PremiumFeature.createItem({
      ...data,
    })
  }

  static async updateFeature(data) {
    const existingFeature = await PremiumFeature.query().where({ id: data.id }).first()
    if (!existingFeature) {
      throw new HttpException('Feature does not exist')
    }
    const feature = await PremiumFeature.query()
      .where({ id: data.id })
      .update({ 
        ...data, 
      })

    return data
  }

  static async removeFeature(ids) {
    try{
      await PremiumFeature.query().whereIn('id', JSON.parse(ids)).delete()
      return true
    }catch(e) {
      return e;
    }
  }
}

module.exports = FeatureService
