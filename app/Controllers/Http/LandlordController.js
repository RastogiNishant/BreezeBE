'use strict'

const { ROLE_LANDLORD } = require('../../constants')
const HttpException = require('../../Exceptions/HttpException')
const UserService = use('App/Services/UserService')
const LandlordService = use('App/Services/LandlordService')
const CompanyService = use('App/Services/CompanyService')
const EstateCurrentTenantService = use('App/Services/EstateCurrentTenantService')
const User = use('App/Models/User')

class LandlordController {
  async fetchLandlords(limit, page) {
    const query = User.query()
    query.where('role', 1)
    query.whereNot('email', null)
    query.whereNot('firstname', null)
    query.whereNot('is_admin', true)
    query.select(
      'id',
      'firstname',
      'secondname',
      'coord',
      'email',
      'phone',
      'approved_landlord',
      'created_at',
      'is_verified',
      'activation_status'
    )
    // query.select('firstname', 'approved_landlord')
    let landlords = await query.orderBy('created_at', 'desc').paginate(page, limit)
    const users = landlords.toJSON({ basicFields: true, publicOnly: false })
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
    query.whereNot('email', null)
    query.whereNot('firstname', null)
    const landlords = await query.orderBy('id', 'desc').paginate(page, limit)
    response.res(landlords)
  }

  /**
   *
   */
  async landlords({ request, auth, response }) {
    const { limit, page, ...params } = request.all()
    const user = auth.user
    const users = await this.fetchLandlords(limit, page)
    return response.res(users)
  }

  /**
   *
   */
  async toggleStatus({ request, response }) {
    const { limit, page, ...params } = request.all()
    const id = params.value

    const user = await User.find(id)
    user.approved_landlord = !user.approved_landlord

    await user.save()
    const users = await this.fetchLandlords(limit, page)
    return response.res(users)
  }

  /**
   *
   */
  async activate({ auth, response }) {
    await CompanyService.validateUserContacts(auth.user.id)

    return response.res(true)
  }

  async getAllTenants({ auth, response }) {
    try {
      let inBreezeTenants = await UserService.getAllInsideTenants(auth.user.id)
      const outsideBreezeTenants = await EstateCurrentTenantService.getAllOutsideTenant(
        auth.user.id
      )
      inBreezeTenants.push(...outsideBreezeTenants)

      response.res(inBreezeTenants)
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }
}

module.exports = LandlordController
