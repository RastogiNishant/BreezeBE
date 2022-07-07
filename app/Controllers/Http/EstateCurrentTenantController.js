'use strict'

const EstateCurrentTenantService = use('App/Services/EstateCurrentTenantService')

class EstateCurrentTenantController {
  async inviteTenantToApp({ request, auth, response }) {
    const { estate_id, id } = request.all()
console.log( 'estate_id', estate_id)    
    response.res(
      await EstateCurrentTenantService.inviteTenantToApp({
        estate_id: estate_id,
        id: id,
        user_id: auth.user.id,
      })
    )
  }
}

module.exports = EstateCurrentTenantController
