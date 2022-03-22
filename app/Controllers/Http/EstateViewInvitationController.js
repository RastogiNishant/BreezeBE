'use strict'
const EstateViewInvite = use('App/Models/EstateViewInvite')

class EstateViewInvitationController {
  async getByCode({request, response}) {
    const code = request.params.code

    const invite = await EstateViewInvite.findBy('code', code)
    const estate = await invite.estate().fetch()
    const landlord = await invite.invitedByUser().fetch()

    const invitation = {...invite.toJSON(), estate, invitedBy: landlord}
    return response.res(invitation)
  }

  async getEstateByHash({request, response}) {
    let estate = request.estate
    let invitedBy = await estate.user().fetch()
    return response.res({estate, invitedBy})
  }
  
}

module.exports = EstateViewInvitationController
