const PremiumFeature = use('App/Models/PremiumFeature')
const HttpException = use('App/Exceptions/HttpException')

class FeatureService {
  static async getFeatures(params = {}) {
    const query = PremiumFeature.query()
    .with('plan')
    if( params.plan_id !== undefined ) {
      query.where('plan_id', params.plan_id)
    }

    if( params.status !== undefined ) {
      query.where('status', params.status)
    }
    
    if( params.role_id !== undefined ) {
      query.where(function () {
        this.orWhere('premium_features.role_id', params.role_id).orWhereNull('premium_features.role_id')
      })
    }

    const features = (await query.orderBy('plan_id', 'asc').orderBy('id', 'asc').fetch()).rows
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
      await PremiumFeature.query().whereIn('id', ids).delete()
      return true
    }catch(e) {
      return e;
    }
  }
}

module.exports = FeatureService
