'use strict'
const AppService = use('App/Services/AppService')
class AppController {
  async createTenantLink({ request, auth, response }) {
    response.res(await AppService.createTenantDynamicLink())
  }
  async createLandlordLink({ request, auth, response }) {}
}
module.exports = AppController
