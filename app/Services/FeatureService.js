const PremiumFeature = use('App/Models/PremiumFeature')
const HttpException = use('App/Exceptions/HttpException')

class FeatureService {
  static async getFeatures(params = {}) {
    const query = PremiumFeature.query()
    if( params.is_basic_plan !== undefined ) {
      query.where('is_basic_plan', params.is_basic_plan)
    }

    if( params.belong_to_basic_plan !== undefined ) {
      query.where('belong_to_basic_plan', params.belong_to_basic_plan)
    }    

    if( params.is_premium_plan !== undefined ) {
      query.where('is_premium_plan', params.is_premium_plan)
    }

    if( params.belong_to_premium_plan !== undefined ) {
      query.where('belong_to_premium_plan', params.belong_to_premium_plan)
    }    
    
    if( params.status !== undefined ) {
      query.where('status', params.status)
    }else{
      query.where('status', true)
    }
    const features = (await query.orderBy('id', 'asc').fetch()).rows
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
