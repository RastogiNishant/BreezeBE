'use strict'

const Logger = use('Logger')
const MatchService = use('App/Services/MatchService')
const EstateService = use('App/Services/EstateService')
const HttpException = use('App/Exceptions/HttpException')

class MatchController {
  /**
   *
   */
  async getOwnEstate(estateId, userId) {
    const estate = await EstateService.getActiveById(estateId, { user_id: userId })
    if (!estate) {
      throw new HttpException('Estate not found', 404)
    }

    return estate
  }

  /**
   *
   */
  async getActiveEstate(estateId) {
    const estate = await EstateService.getActiveById(estateId)
    if (!estate) {
      throw new HttpException('Estate not found', 404)
    }

    return estate
  }

  /**
   * Tenant
   * Knock to estate
   */
  async knockEstate({ request, auth, response }) {
    const { estate_id } = request.all()
    await this.getActiveEstate(estate_id)

    try {
      const result = await MatchService.knockEstate(estate_id, auth.user.id)
      return response.res(result)
    } catch (e) {
      Logger.error(e)
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400)
      }
      throw e
    }
  }

  /**
   * Landlord
   * If use knock (or just buddy) move to invite
   */
  async matchToInvite({ request, auth, response }) {
    const landlordId = auth.user.id
    const { estate_id, user_id } = request.all()
    // Check is estate owner
    await this.getOwnEstate(estate_id, landlordId)

    try {
      await MatchService.inviteKnockedUser(estate_id, user_id)
      return response.res(true)
    } catch (e) {
      Logger.error(e)
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400)
      }
      throw e
    }
  }

  /**
   * Landlord
   * If user invited but need to rollback
   */
  async removeInvite({ request, auth, response }) {
    const { estate_id, user_id } = request.all()
    await this.getOwnEstate(estate_id, auth.user.id)

    try {
      await MatchService.cancelInvite(estate_id, user_id)
      return response.res(true)
    } catch (e) {
      Logger.error(e)
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400)
      }
      throw e
    }
  }

  /**
   * Tenant
   * Select available timeslot and
   */
  async chooseVisitTimeslot({ request, auth, response }) {
    const userId = auth.user.id
    const { estate_id, date } = request.all()
    await this.getActiveEstate(estate_id)

    try {
      await MatchService.bookTimeslot(estate_id, userId, date)
      return response.res(true)
    } catch (e) {
      Logger.error(e)
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400)
      }
      throw e
    }
  }

  /**
   * Landlord
   * Get access to user share data
   */
  async shareTenantData({ request, auth, response }) {
    const { estate_id, code } = request.all()
    const userId = auth.user.id
    await this.getOwnEstate(estate_id, userId)

    try {
      await MatchService.share(userId, estate_id, code)
      return response.res(true)
    } catch (e) {
      Logger.error(e)
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400)
      }
      throw e
    }
  }

  /**
   * Landlord
   * Move user to Top list
   */
  async moveUserToTop({ request, auth, response }) {
    const { user_id, estate_id } = request.all()
    await this.getOwnEstate(estate_id, auth.user.id)
    const success = await MatchService.toTop(estate_id, user_id)
    if (!success) {
      throw new HttpException('Cant move to top', 400)
    }

    response.res(true)
  }

  /**
   * Landlord
   * Discard user move to Top list
   */
  async discardUserToTop({ request, auth, response }) {
    const { user_id, estate_id } = request.all()
    await this.getOwnEstate(estate_id, auth.user.id)
    try {
      await MatchService.removeFromTop(estate_id, user_id)
    } catch (e) {
      Logger.error(e)
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400)
      }
      throw e
    }

    response.res(true)
  }

  /**
   * Landlord
   * Request tenant commitment to final rent stage
   */
  async requestUserCommit({ request, auth, response }) {
    const { user_id, estate_id } = request.all()
    await this.getOwnEstate(estate_id, auth.user.id)
    await MatchService.requestFinalConfirm(estate_id, user_id)

    response.res(true)
  }

  /**
   * Tenant
   * Accept rent
   */
  async commitEstateRent({ request, auth, response }) {
    const userId = auth.user.id
    const { estate_id } = request.all()
    await this.getActiveEstate(estate_id)
    await MatchService.finalConfirm(estate_id, userId)

    response.res(true)
  }

  /**
   *
   */
  async getMatchesListTenant({ request, auth, response }) {
    const user = auth.user
    const {
      filters: { buddy, like, dislike, knock, invite, share, top, commit },
      page,
      limit,
    } = request.all()

    const estates = await MatchService.getTenantMatchesWithFilterQuery(user.id, {
      buddy,
      dislike,
      like,
      knock,
      invite,
      share,
      top,
      commit,
    }).paginate(page, limit)

    response.res(estates.toJSON({ isShort: true }))
  }

  /**
   * Get matches user for landlord
   */
  async getMatchesListLandlord({ request, auth, response }) {
    const user = auth.user
    const {
      estate_id,
      filters: { knock, buddy, invite, visit, top, commit },
      page,
      limit,
    } = request.all()

    const estate = await EstateService.getQuery({ id: estate_id, user_id: user.id }).first()
    if (!estate) {
      throw new HttpException('Not found', 404)
    }

    const tenants = await MatchService.getLandlordMatchesWithFilterQuery(estate, {
      knock,
      buddy,
      invite,
      visit,
      top,
      commit,
    }).paginate(page, limit)

    response.res(tenants.toJSON({ isShort: true }))
  }
}

module.exports = MatchController
