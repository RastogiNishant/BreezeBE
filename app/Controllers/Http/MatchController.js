'use strict'

const Logger = use('Logger')
const Database = use('Database')
const File = use('App/Classes/File')
const MatchService = use('App/Services/MatchService')
const CompanyService = use('App/Services/CompanyService')
const Estate = use('App/Models/Estate')
const EstateService = use('App/Services/EstateService')
const HttpException = use('App/Exceptions/HttpException')
const { ValidationException } = use('Validator')
const { reduce, isEmpty, toArray } = require('lodash')

const {
  ROLE_LANDLORD,
  STATUS_ACTIVE,
  STATUS_EXPIRE,
  MATCH_STATUS_COMMIT,
  MATCH_STATUS_INVITE,
  MATCH_STATUS_NEW,
  MATCH_STATUS_KNOCK,
  MATCH_STATUS_VISIT,
  MATCH_STATUS_SHARE,
  MATCH_STATUS_TOP,
  MATCH_STATUS_FINISH,
} = require('../../constants')

class MatchController {
  /**
   *
   */
  async getOwnEstate(estateId, userId) {
    const estate = await Estate.query()
      .where({ id: estateId, user_id: userId })
      .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
      .first()
    if (!estate) {
      throw new HttpException('Estate not found', 404)
    }

    return estate
  }

  /**
   *
   */
  async getActiveEstate(estateId, withExpired = true) {
    const estate = await EstateService.getActiveById(
      estateId,
      withExpired ? undefined : { status: STATUS_ACTIVE }
    )

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
    await this.getActiveEstate(estate_id, false)

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

  async removeKnock({ request, auth, response }) {
    const { estate_id } = request.all()
    await this.getActiveEstate(estate_id, false)

    try {
      const result = await MatchService.cancelKnock(estate_id, auth.user.id)
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
   *
   */
  async removeInviteByTenant({ request, auth, response }) {
    const { estate_id } = request.all()
    try {
      await MatchService.cancelInvite(estate_id, auth.user.id)
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

  async cancelVisit({ request, auth, response }) {
    const userId = auth.user.id
    const { estate_id } = request.all()
    console.log({ estate_id, userId })
    await this.getActiveEstate(estate_id)

    try {
      await MatchService.cancelVisit(estate_id, userId)
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
   *
   */
  async updateVisitTimeslotLandlord({ request, auth, response }) {
    const { estate_id, status, delay = null } = request.all()
    const estate = await this.getOwnEstate(estate_id, auth.user.id)
    if (!estate) {
      throw HttpException('Invalid estate', 404)
    }

    await MatchService.updateVisitStatusLandlord(estate_id, {
      lord_status: status,
      lord_delay: delay || 0,
    })

    return response.res(true)
  }

  /**
   *
   */
  async updateVisitTimeslotTenant({ request, auth, response }) {
    const { estate_id, status, delay = null } = request.all()
    console.log({ status })
    await MatchService.updateVisitStatus(estate_id, auth.user.id, {
      tenant_status: status,
      tenant_delay: delay,
    })

    return response.res(true)
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

  async cancelShare({ request, auth, response }) {
    const { estate_id } = request.all()
    await this.getActiveEstate(estate_id)
    try {
      await MatchService.cancelShare(estate_id, auth.user.id)
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

  async tenantCancelCommit({ request, auth, response }) {
    const { estate_id } = request.all()
    await this.getActiveEstate(estate_id)
    await MatchService.tenantCancelCommit(estate_id, auth.user.id)
    response.res(true)
  }

  /**
   * Tenant
   * Accept rent
   */
  async commitEstateRent({ request, auth, response }) {
    const userId = auth.user.id
    const { estate_id } = request.all()
    const estate = await this.getActiveEstate(estate_id)
    await MatchService.finalConfirm(estate_id, userId)
    let contact = await estate.getContacts()
    if (contact) {
      contact = contact.toJSON()
      contact.avatar = File.getPublicUrl(contact.avatar)
    }
    response.res({ estate, contact })
  }

  /**
   *
   */
  async getMatchesListTenant({ request, auth, response }) {
    const user = auth.user
    // filters: { buddy, like, dislike, knock, invite, share, top, commit },
    const { filters, page, limit } = request.all()
    // If no tabs, select latest active tab
    const activeFilters = reduce(filters, (n, v, k) => (v ? n.concat(k) : n), [])
    let currentTab
    if (isEmpty(activeFilters)) {
      const tab = await MatchService.getTenantLastTab(auth.user.id)
      filters[tab] = true
      currentTab = tab
    } else {
      currentTab = activeFilters[0]
    }

    const estates = await MatchService.getTenantMatchesWithFilterQuery(user.id, filters).paginate(
      page,
      limit
    )

    const fields = ['buddy', 'date', 'user_id', 'visit_status', 'delay', 'share']
    const extraFields = filters.commit
      ? ['email', 'avatar', 'phone', 'firstname', 'secondname', ...fields]
      : fields

    return response.res({
      ...estates.toJSON({ isShort: true, extraFields }),
      tab: currentTab,
    })
  }

  async getTenantUpcomingVisits({ auth, response }) {
    const estates = await MatchService.getTenantUpcomingVisits(auth.user.id).paginate(1, 999999)
    const fields = [
      'street',
      'city',
      'zip',
      'email',
      'avatar',
      'phone',
      'firstname',
      'secondname',
      'buddy',
      'date',
      'user_id',
      'visit_status',
      'delay',
      'share',
      'like',
      'dislike',
    ]

    return response.res({
      ...estates.toJSON({ isShort: true, fields }),
    })
  }

  async getMatchesCountsTenant({ auth, response }) {
    const user = auth.user
    const datas = await Promise.all([
      MatchService.getTenantLikesCount(user.id),
      MatchService.getTenantDislikesCount(user.id),
      MatchService.getTenantKnocksCount(user.id),
      MatchService.getTenantSharesCount(user.id),
      MatchService.getTenantInvitesCount(user.id),
      MatchService.getTenantVisitsCount(user.id),
      MatchService.getTenantCommitsCount(user.id),
      MatchService.getTenantTopsCount(user.id),
      MatchService.getTenantBuddiesCount(user.id),
    ])
    const [{ count: likesCount }] = datas[0]
    const [{ count: dislikesCount }] = datas[1]
    const [{ count: knocksCount }] = datas[2]
    const [{ count: sharesCount }] = datas[3]
    const [{ count: invitesCount }] = datas[4]
    const [{ count: visitsCount }] = datas[5]
    const [{ count: commitsCount }] = datas[6]
    const [{ count: topsCount }] = datas[7]
    const [{ count: buddiesCount }] = datas[8]
    return response.res({
      like: parseInt(likesCount),
      dislike: parseInt(dislikesCount),
      knock: parseInt(knocksCount),
      share: parseInt(sharesCount),
      visit: parseInt(parseInt(invitesCount) + parseInt(visitsCount)),
      commit: parseInt(commitsCount),
      decide: parseInt(commitsCount) + parseInt(topsCount),
      buddie: parseInt(buddiesCount),
    })
  }

  async getMatchesStageCountsTenant({ request, auth, response }) {
    const user = auth.user
    const { filter } = request.all()

    if (filter === 'visit') {
      const datas = await Promise.all([
        MatchService.getTenantInvitesCount(user.id),
        MatchService.getTenantVisitsCount(user.id),
      ])
      const [{ count: invitesCount }] = datas[0]
      const [{ count: visitsCount }] = datas[1]
      return response.res({
        invite: parseInt(invitesCount),
        visit: parseInt(visitsCount),
        stage: parseInt(invitesCount) + parseInt(visitsCount),
      })
    } else if (filter === 'decide') {
      const datas = await Promise.all([
        MatchService.getTenantTopsCount(user.id),
        MatchService.getTenantCommitsCount(user.id),
      ])
      const [{ count: topsCount }] = datas[0]
      const [{ count: commitsCount }] = datas[1]
      return response.res({
        top: parseInt(topsCount),
        commit: parseInt(commitsCount),
        stage: parseInt(topsCount) + parseInt(commitsCount),
      })
    } else {
      throw new HttpException('Invalid stage', 400)
    }
  }

  async searchForTenant({ request, auth, response }) {
    const { limit, page, ...params } = request.all()
    const estates = await MatchService.searchForTenant(auth.user.id, params).paginate(1, 999999)
    const fields = [
      'street',
      'city',
      'zip',
      'email',
      'avatar',
      'phone',
      'firstname',
      'secondname',
      'buddy',
      'date',
      'user_id',
      'visit_status',
      'delay',
      'share',
      'like',
      'dislike',
    ]

    return response.res({
      ...estates.toJSON({ isShort: true, fields }),
    })
  }

  /**
   * Get matches summary  for landlord
   */
  async getMatchesSummaryLandlord({ request, auth, response }) {
    const user = auth.user
    const estates = await Estate.query()
      .where({ user_id: user.id })
      .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
      .select('id')
      .fetch()
    const estatesJson = estates.toJSON({ isShort: true })
    var estatesId = estatesJson.map(function (item) {
      return item['id']
    })

    const totalInvite = await Database.table('matches')
      .count('*')
      .where({ user_id: user.id, status: MATCH_STATUS_INVITE })
    // .whereIn({estate_id: estatesId})

    const totalVisits = await Database.table('visits').count('*').whereIn('estate_id', estatesId)

    const totalDecided = await Database.table('matches')
      .count('*')
      .where({ user_id: user.id, status: MATCH_STATUS_COMMIT })
    // .whereIn({estate_id: estatesId})

    const matches = await Database.table('matches')
      .count('*')
      .where({ user_id: user.id, status: MATCH_STATUS_KNOCK })

    const buddies = await Database.table('matches')
      .count('*')
      .where({ user_id: user.id, status: MATCH_STATUS_NEW, buddy: true })

    const invites = await Database.table('matches')
      .count('*')
      .where({ user_id: user.id, status: MATCH_STATUS_INVITE })

    const visits = await Database.table('matches')
      .count('*')
      .where({ user_id: user.id, status: MATCH_STATUS_VISIT, buddy: true })
      .orWhere({ user_id: user.id, status: MATCH_STATUS_SHARE, buddy: true })

    const top = await Database.table('matches')
      .count('*')
      .where({ user_id: user.id, status: MATCH_STATUS_TOP })

    const finalMatches = await Database.table('matches')
      .count('*')
      .where({ user_id: user.id, status: MATCH_STATUS_COMMIT, buddy: true })
      .orWhere({ user_id: user.id, status: MATCH_STATUS_FINISH, buddy: true })

    console.log(
      'jgkgjkgjgk',
      totalInvite[0].count,
      totalVisits[0].count,
      totalDecided[0].count,
      matches[0].count,
      buddies[0].count,
      invites[0].count,
      visits[0].count,
      top[0].count,
      finalMatches[0].count
    )
    return response.res({
      totalInvite: totalInvite[0].count,
      totalVisits: totalVisits[0].count,
      totalDecided: totalDecided[0].count,

      matches: matches[0].count,
      buddies: buddies[0].count,
      invites: invites[0].count,
      visits: visits[0].count,
      top: top[0].count,
      finalMatches: finalMatches[0].count,
    })
  }
  /**
   * Get matches user for landlord
   */
  async getMatchesListLandlord({ request, auth, response }) {
    const user = auth.user
    // filters = { knock, buddy, invite, visit, top, commit }
    const { estate_id, filters, page, limit } = request.all()
    const estate = await EstateService.getQuery({ id: estate_id, user_id: user.id }).first()
    if (!estate) {
      throw new HttpException('Not found', 404)
    }
    const activeFilters = reduce(filters, (n, v, k) => (v ? n.concat(k) : n), [])
    let currentTab
    if (isEmpty(activeFilters)) {
      const tab = await MatchService.getLandlordLastTab(estate_id)
      filters[tab] = true
      currentTab = tab
    } else {
      currentTab = activeFilters[0]
    }
    const tenants = await MatchService.getLandlordMatchesWithFilterQuery(estate, filters).paginate(
      page,
      limit
    )
    const fields = ['buddy', 'date', 'user_id', 'visit_status', 'delay']
    const extraFields = filters.commit ? ['email', 'phone', 'last_address', ...fields] : fields

    const data = tenants.toJSON({ isShort: true, extraFields })
    // Add avatar path to data
    data.data = data.data.map((i) => ({ ...i, avatar: File.getPublicUrl(i.avatar) }))

    return response.res({
      ...data,
      tab: currentTab,
    })
  }

  /**
   *
   */
  async changeOrder({ request, auth, response }) {
    const { estate_id, user_id, position } = request.all()
    if (auth.user.role === ROLE_LANDLORD && !user_id) {
      throw ValidationException.validationFailed([{ field: 'user_id', validation: 'required' }])
    }
    await MatchService.reorderMatches(auth.user, estate_id, user_id, position)

    return response.res(true)
  }

  /**
   *
   */
  async inviteToCome({ request, auth, response }) {
    const { estate_id, user_id } = request.all()
    await this.getOwnEstate(estate_id, auth.user.id)
    await MatchService.inviteUserToCome(estate_id, user_id)

    response.res(true)
  }
}

module.exports = MatchController
