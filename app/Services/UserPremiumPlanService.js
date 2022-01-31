const UserPremiumPlan = use('App/Models/UserPremiumPlan')
const AppException = use('App/Exceptions/AppException')
const Logger = use('Logger')
const Database = use('Database')
const { isObject } = require('lodash')

class UserPremiumPlanService {

  /**
   *
   * @param {*}
   * data : JSON Object [{user_id:user_id, premium_id:premium_id}]
   */

  static async updateUserPremiumPlans(premiums, userId) {
    if( !premiums ) {
      throw AppException( 'There is no data' )
    }
    try{

      if(!isObject(premiums)){
        premiums = JSON.parse(premiums);
      }

      await UserPremiumPlan.query().where('user_id', userId).delete()
      const userPremiumPlans = await Promise.all( premiums.map( p => {
        return { user_id: userId, premium_id:p}
      }) );

      return await UserPremiumPlan.createMany(userPremiumPlans)
    }catch(e) {
      Logger.error('updateUserPremiumPlans error', e );
      return false;
    }
  }

  static async getUserPremiumPlans(userId) {
    // const query = UserPremiumPlan.query()
    // const pserPremiumPlans = await query.where('user_id', userId).orderBy('premium_id', 'asc').fetch()
    // return pserPremiumPlans    
    return Database
      .select('pf.*')
      .select('upp.user_id')
      .from({ pf: 'premium_features' })
      // .leftJoin({ upp: 'user_premium_plans' }, 'upp.premium_id', 'pf.id' )
      .leftJoin({ upp: 'user_premium_plans' }, function () {
        this.on('upp.premium_id', 'pf.id').onIn('upp.user_id', userId)
      })

      .orderBy('upp.premium_id', 'asc')
  }
}

module.exports = UserPremiumPlanService;