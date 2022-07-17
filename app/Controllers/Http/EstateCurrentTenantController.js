'use strict'

const HttpException = require('../../Exceptions/HttpException')

const EstateCurrentTenantService = use('App/Services/EstateCurrentTenantService')

class EstateCurrentTenantController {
  async inviteTenantToAppByEmail({ request, auth, response }) {
    const { estate_id, id } = request.all()
    try {
      response.res(
        await EstateCurrentTenantService.inviteTenantToAppByEmail({
          estate_id: estate_id,
          id: id,
          user_id: auth.user.id,
        })
      )
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async acceptOutsideTenant({ request, response }) {
    const { data1, data2, password } = request.all()

    if (!data1 || !data2) {
      throw new HttpException('Not enough params', 500)
    }

    response.res(await EstateCurrentTenantService.acceptOutsideTenant({ data1, data2, password }))
  }

  async inviteTenantToAppBySMS({ request, auth, response }) {
    const { estate_id, id } = request.all()
    try {
      response.res(
        await EstateCurrentTenantService.inviteTenantToAppBySMS({
          estate_id: estate_id,
          id: id,
          user_id: auth.user.id,
        })
      )
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }
}

module.exports = EstateCurrentTenantController
