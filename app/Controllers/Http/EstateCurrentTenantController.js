'use strict'

const { request } = require('express')

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

  async expired({ request, auth, response }) {
    const { id } = request.all()
    response.res(await EstateCurrentTenantService.expired(id, auth.user.id))
  }
}

module.exports = EstateCurrentTenantController
