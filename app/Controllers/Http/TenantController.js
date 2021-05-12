'use strict'

const HttpException = use('App/Exceptions/HttpException')
const TenantService = use('App/Services/TenantService')
const UserService = use('App/Services/UserService')

const { ROLE_USER, ROLE_LANDLORD, MEMBER_FILE_TYPE_INCOME } = require('../../constants')

class TenantController {
  /**
   *
   */
  async getProtectedFile({ request, auth, response }) {
    const { user_id, file_id, file_type, member_id } = request.all()
    if (auth.user.role === ROLE_USER) {
      if (+auth.user.id !== +user_id) {
        throw new HttpException('No access', 403)
      }
    } else if (auth.user.role === ROLE_LANDLORD) {
      // TODO: check is landlord has access to tenant docs
    } else {
      throw new HttpException('No access', 403)
    }

    if (file_type === MEMBER_FILE_TYPE_INCOME) {
      if (!file_id) {
        throw new HttpException('File id required', 400)
      }
    }

    const link = await TenantService.getProtectedFileLink(user_id, file_id, file_type, member_id)

    response.res(link)
  }

  /**
   *
   */
  async updateTenant({ request, auth, response }) {
    const data = request.all()

    const tenant = await UserService.getOrCreateTenant(auth.user)
    await tenant.updateItem(data)

    response.res(false)
  }
}

module.exports = TenantController
