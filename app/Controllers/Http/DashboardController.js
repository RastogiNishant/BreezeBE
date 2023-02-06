'use strict'

const DashbardService = use('App/Services/DashboardService')

class DashboardController {
  async getDashboardCount({ request, auth, response }) {
    response.res(await DashbardService.getDashboardCounts(auth.user.id))
  }
}

module.exports = DashboardController
