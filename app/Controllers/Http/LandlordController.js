'use strict'

const LandlordService = use('App/Services/LandlordService')
const CompanyService = use('App/Services/CompanyService')
const User = use('App/Models/User')

class LandlordController {
  /**
   *
   */
  async getLordVisits({ auth, response }) {
    const slots = await LandlordService.getBookedTimeslots(auth.user.id)

    response.res(slots)
  }

    /**
   *
   */
  async getLandlords({ request, auth, response }) {
    
    const { limit, page, ...params } = request.all()
    const user = auth.user

    const query = User.query()
    query.where('role', 1)
    const landlords = await query.orderBy('id', 'desc').paginate(page, limit)
    console.log('ggg', landlords);
    response.res(landlords)
  }
  

    /**
   *
   */
  async toggleStatus({ request, response }) {

    const {  ...params } = request.all()
    const id = params.value;
     
    
    const user  = await User.find(id)
    user.approved_landlord = !user.approved_landlord  

    await user.save()

    const query = User.query()
    query.where('role', 1)
    const landlords = await query.orderBy('id', 'desc').paginate(1, 20)
     
    response.res(landlords);
  }

  /**
   *
   */
  async activate({ auth, response }) {
    await CompanyService.validateUserContacts(auth.user.id)

    return response.res(true)
  }
}

module.exports = LandlordController
