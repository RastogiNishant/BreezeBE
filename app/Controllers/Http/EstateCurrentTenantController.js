'use strict'

const HttpException = require('../../Exceptions/HttpException')

const EstateCurrentTenantService = use('App/Services/EstateCurrentTenantService')

class EstateCurrentTenantController {
  async create({ request, auth, response }) {
    const { estate_id, ...data } = request.all()
    const estateCurrentTenant = await EstateCurrentTenantService.addCurrentTenant({
      data,
      estate_id,
      user_id: auth.user.id,
    })
    response.res(estateCurrentTenant)
  }

  async update({ request, auth, response }) {
    const { id, estate_id, ...data } = request.all()
    const estateCurrentTenant = await EstateCurrentTenantService.updateCurrentTenant({
      data,
      id,
      estate_id,
      user_id: auth.user.id,
    })
    response.res(estateCurrentTenant)
  }

  async getAll({ request, auth, response }) {
    const { status, estate_id, page, limit } = request.all()
    response.res(
      await EstateCurrentTenantService.getAll({
        user_id: auth.user.id,
        estate_id: estate_id,
        status: status,
        page: page,
        limit: limit,
      })
    )
  }

  async delete({ request, auth, response }) {
    const { id } = request.all()
    response.res(await EstateCurrentTenantService.delete(id, auth.user.id))
  }

  async expire({ request, auth, response }) {
    const { id } = request.all()
    response.res(await EstateCurrentTenantService.expire(id, auth.user.id))
  }

  async inviteTenantToAppByEmail({ request, auth, response }) {
    const { estate_id, ids } = request.all()

    try {
      response.res(
        await EstateCurrentTenantService.inviteTenantToAppByEmail({
          estate_id: estate_id,
          ids: ids,
          user_id: auth.user.id,
        })
      )
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async inviteTenantToAppByLetter({ request, auth, response }) {
    const { estate_id, ids } = request.all()
    try {
      response.res(
        await EstateCurrentTenantService.getDynamicLinks({
          estate_id: estate_id,
          ids: ids,
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
