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
    const { ids } = request.all()

    try {
      response.res(
        await EstateCurrentTenantService.inviteTenantToAppByEmail({
          ids: ids,
          user_id: auth.user.id,
        })
      )
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async inviteTenantToAppByLetter({ request, auth, response }) {
    const { ids } = request.all()
    try {
      response.res(
        await EstateCurrentTenantService.getDynamicLinks({
          ids: ids,
          user_id: auth.user.id,
        })
      )
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async acceptOutsideTenant({ request, response }) {
    const { data1, data2, password, email } = request.all()

    if (!data1 || !data2) {
      throw new HttpException('Not enough params', 400)
    }

    response.res(
      await EstateCurrentTenantService.acceptOutsideTenant({
        data1,
        data2,
        password,
        email,
      })
    )
  }

  async acceptAlreadyRegisterdOutsideTenant({ request, response, auth }) {
    const { data1, data2 } = request.all()
    if (!data1 || !data2) {
      throw new HttpException('Not enough params', 400)
    }

    response.res(
      await EstateCurrentTenantService.acceptOutsideTenant({
        data1,
        data2,
        user: auth.user,
      })
    )
  }

  async inviteTenantToAppBySMS({ request, auth, response }) {
    const { ids } = request.all()
    try {
      const errorPhonNumbers = await EstateCurrentTenantService.inviteTenantToAppBySMS({
        ids: ids,
        user_id: auth.user.id,
      })

      if (errorPhonNumbers && errorPhonNumbers.length) {
        const msg = ` Not delivered to ` + errorPhonNumbers.join(',')
        throw new HttpException(msg, 400)
      }

      response.res(true)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async disconnect({ request, auth, response }) {
    const { ids } = request.all()
    try {

    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = EstateCurrentTenantController
