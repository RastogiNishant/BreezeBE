'use strict'

const { ERROR_OUTSIDE_TENANT_INVITATION_INVALID } = require('../../constants')
const HttpException = require('../../Exceptions/HttpException')
const EstateService = require('../../Services/EstateService')
const EstateCurrentTenantService = use('App/Services/EstateCurrentTenantService')
const Database = use('Database')

class EstateCurrentTenantController {
  async create({ request, auth, response }) {
    const { estate_id, ...data } = request.all()
    const estateCurrentTenant = await EstateCurrentTenantService.addCurrentTenant({
      data,
      estate_id,
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

  async get({ request, auth, response }) {
    const { id } = request.all()
    try {
      response.res(await EstateCurrentTenantService.getWithAbsoluteAttachments(id, auth.user.id))
    } catch (e) {
      throw new HttpException(e.message, e.status || 500)
    }
  }

  async removeLeaseContract({ request, auth, response }) {
    const { id, uri } = request.all()
    try {
      response.res(
        await EstateCurrentTenantService.removeLeaseContract({ id, uri, user: auth.user })
      )
    } catch (e) {
      throw new HttpException(e.message, e.status || 500)
    }
  }

  async delete({ request, auth, response }) {
    const { ids } = request.all()
    response.res(await EstateCurrentTenantService.handleDelete({ ids, user_id: auth.user.id }))
  }

  async expire({ request, auth, response }) {
    const { id } = request.all()
    response.res(await EstateCurrentTenantService.expire(id, auth.user.id))
  }

  async inviteTenantToApp({ request, auth, response }) {
    const { invites } = request.all()
    response.res(
      await EstateCurrentTenantService.inviteTenantToApp({ user_id: auth.user.id, invites })
    )
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
      let { failureCount, links } = await EstateCurrentTenantService.getDynamicLinks({
        ids: ids,
        user_id: auth.user.id,
      })

      response.res({
        successCount: (ids.length || 0) - failureCount,
        failureCount,
        links,
      })
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async validateInvitationQRCode({ request, response }) {
    const { data1, data2 } = request.all()
    if (!data1 || !data2) {
      throw new HttpException('Not enough params', 400, ERROR_OUTSIDE_TENANT_INVITATION_INVALID)
    }
    response.res(await EstateCurrentTenantService.validateInvitationQRCode({ data1, data2 }))
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
      response.res(
        await EstateCurrentTenantService.inviteTenantToAppBySMS({
          ids: ids,
          user_id: auth.user.id,
        })
      )
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async revokeInvitation({ request, auth, response }) {
    const { ids } = request.all()
    try {
      response.res(await EstateCurrentTenantService.revokeInvitation(auth.user.id, ids))
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async disconnect({ request, auth, response }) {
    const { ids } = request.all()
    try {
      response.res(await EstateCurrentTenantService.disconnect(auth.user.id, ids))
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async retrieveLinkByCode({ request, auth, response }) {
    const { code } = request.all()
    const ip = request.ip()
    response.res(await EstateCurrentTenantService.retrieveLinkByCode(code, ip))
  }

  async addLeaseContract({ request, auth, response }) {
    try {
      response.res(await EstateCurrentTenantService.addLeaseContract(request, auth.user))
    } catch (e) {
      throw new HttpException(e.message, e.status || 500)
    }
  }
}

module.exports = EstateCurrentTenantController
