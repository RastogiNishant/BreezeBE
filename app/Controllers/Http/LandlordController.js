'use strict'

const LandlordService = use('App/Services/LandlordService')
const CompanyService = use('App/Services/CompanyService')
const User = use('App/Models/User')


class LandlordController {


  async fetchLandlords( limit, page)
  {
    const query = User.query()
    query.where('role', 1)
    query.whereNot("email", null);
    query.whereNot("firstname", null);
    query.select('id', 'firstname', 'secondname', 'coord', 'email', 'phone', 'approved_landlord')
    // query.select('firstname', 'approved_landlord')
    let landlords = await query.orderBy('id', 'desc').paginate(page, limit)
    const users = landlords.toJSON({ basicFields: true, publicOnly : false })
    return users

  }

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
    query.whereNot("email", null);
    query.whereNot("firstname", null);
    const landlords = await query.orderBy('id', 'desc').paginate(page, limit)
    response.res(landlords)
  }
  
      /**
   *
   */
  async landlords({ request, auth, response }) {
    
    const { limit, page, ...params } = request.all()
    const user = auth.user
    const users = await this.fetchLandlords( limit, page);
    return response.res(users)
  }

    /**
   *
   */
  async toggleStatus({ request, response }) {

    const { limit, page, ...params } = request.all()
    const id = params.value;
     
    
    const user  = await User.find(id)
    user.approved_landlord = !user.approved_landlord  

    await user.save()
    const users = await this.fetchLandlords( limit, page);
    return response.res(users)
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
