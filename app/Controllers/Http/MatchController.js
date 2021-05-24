'use strict'

class MatchController {
  /**
   * Tenant
   * Knock to estate
   */
  async knockEstate({ request, auth, response }) {
    const { estate_id } = request.all()
    // TODO: check is match in status new
    response.res(false)
  }

  /**
   * Landlord
   * If use knock (or just buddy) move to invite
   */
  async matchToInvite({ request, auth, response }) {
    const { estate_id, tenant_id } = request.all()
    // TODO: If match with status "knock" move it to invite
    response.res(false)
  }

  /**
   * Landlord
   * If user invited but need to rollback
   */
  async removeInvite({ request, auth, response }) {
    const { estate_id, tenant_id } = request.all()
    // TODO: if in invite status move back to knock status
    response.res(false)
  }

  /**
   * Tenant
   * Select available timeslot and
   */
  async chooseVisitTimeslot({ request, auth, response }) {
    const { estate_id, date } = request.all()
    // TODO: Check is timeslot still free, to book timeslot and move to visits status
    response.res(false)
  }

  /**
   * Landlord
   * Get access to user share data
   */
  async shareTenantData({ request, auth, response }) {
    const { estate_id } = request.all()
    // TODO: Mark user protected data as allowed
    response.res(false)
  }

  /**
   * Landlord
   * Move user to Top list
   */
  async moveUserToTop({ request, auth, response }) {
    // TODO: if user on visits status, move it to Top
  }

  /**
   * Landlord
   * Discard user move to Top list
   */
  async discardUserToTop({ request, auth, response }) {
    // TODO: Move user from Top list to Visits
  }

  /**
   * Landlord
   * Request tenant commitment to final rent stage
   */
  async requestUserCommit({ request, auth, response }) {
    // TODO: Commit user to final match
  }

  /**
   * Tenant
   * Accept rent
   */
  async commitEstateRent({ request, auth, response }) {
    // TODO: check valid status and move match to final stage
  }
}

module.exports = MatchController
