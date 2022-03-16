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

  static async updateUserPremiumPlans(userId, plan_id, receipt, trx ) {
    try{

      // await UserPremiumPlan.query().where('user_id', userId).delete()
      // const userPremiumPlans = await Promise.all( premiums.map( p => {
      //   return { user_id: userId, plan_id:p}
      // }) );

      // return await UserPremiumPlan.createMany(userPremiumPlans)

      /** To do: this api needs to be updated later  */
    }catch(e) {
      Logger.error('updateUserPremiumPlans error', e );
      return false;
    }
  }

  static async getUserPremiumPlans(userId) {
    return await UserPremiumPlan.query()
      .with('plan')
      .where('user_id', userId)
  }
}

module.exports = UserPremiumPlanService;