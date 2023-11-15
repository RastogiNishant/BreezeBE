/* eslint-disable no-case-declarations */
'use strict'

const Logger = use('Logger')
const Database = use('Database')
const File = use('App/Classes/File')
const MatchService = use('App/Services/MatchService')
const Estate = use('App/Models/Estate')
const Admin = use('App/Models/Admin')
const User = use('App/Models/User')
const EstateService = use('App/Services/EstateService')
const HttpException = use('App/Exceptions/HttpException')
const { ValidationException } = use('Validator')
const MailService = use('App/Services/MailService')
const { reduce, isEmpty, isNull, uniqBy, uniq, orderBy, uniqWith } = require('lodash')
const moment = require('moment')
const Event = use('Event')
const NoticeService = use('App/Services/NoticeService')
const WebSocket = use('App/Classes/Websocket')

const {
  ROLE_LANDLORD,
  STATUS_ACTIVE,
  STATUS_EXPIRE,
  MATCH_STATUS_NEW,
  MATCH_STATUS_KNOCK,
  MATCH_STATUS_INVITE,
  MATCH_STATUS_VISIT,
  MATCH_STATUS_SHARE,
  MATCH_STATUS_TOP,
  MATCH_STATUS_COMMIT,
  MATCH_STATUS_FINISH,
  TENANT_MATCH_FIELDS,
  DAY_FORMAT,
  DATE_FORMAT,
  LOG_TYPE_KNOCKED,
  LOG_TYPE_VISITED,
  LOG_TYPE_FINAL_MATCH_REQUEST,
  LOG_TYPE_FINAL_MATCH_APPROVAL,
  LOG_TYPE_INVITED,
  LOG_TYPE_SHOWED,
  TENANT_EMAIL_INVITE,
  ROLE_USER,
  LOG_TYPE_GOT_INVITE,
  VISIT_MAX_ALLOWED_FOLLOWUPS,
  LETTING_TYPE_VOID,
  LETTING_TYPE_NA,
  LETTING_TYPE_LET,
  STATUS_DRAFT,
  LETTING_STATUS_STANDARD,
  LETTING_STATUS_TERMINATED,
  LETTING_STATUS_VACANCY,
  LETTING_STATUS_NEW_RENOVATED,
  STATUS_OFFLINE_ACTIVE,
  LOG_TYPE_REQUEST_PROFILE,
  STATUS_DELETE,
  DEFAULT_LANG
} = require('../../constants')
const { createDynamicLink } = require('../../Libs/utils')
const ThirdPartyOfferService = require('../../Services/ThirdPartyOfferService')

const { logEvent } = require('../../Services/TrackingService')
const VisitService = require('../../Services/VisitService')
const {
  exceptions: {
    UNSECURE_PROFILE_SHARE,
    NO_TASK_FOUND,
    ERROR_MATCH_COMMIT_DOUBLE,
    ESTATE_NOT_EXISTS
  },
  exceptionCodes: { WARNING_UNSECURE_PROFILE_SHARE, ERROR_MATCH_COMMIT_DOUBLE_CODE }
} = require('../../exceptions')
const TaskService = use('App/Services/TaskService')
const ChatService = use('App/Services/ChatService')
const Promise = use('bluebird')

class MatchController {
  /**
   *
   */
  async getActiveEstate(estateId, withExpired = true) {
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
    const { estate_id, knock_anyway, share_profile, buddy } = request.all()
    try {
      const result = await MatchService.knockEstate({
        estate_id,
        user_id: auth.user.id,
        knock_anyway,
        share_profile,
        buddy
      })
      logEvent(request, LOG_TYPE_KNOCKED, auth.user.id, { estate_id, role: ROLE_USER }, false)
      Event.fire('mautic:syncContact', auth.user.id, { knocked_count: 1 })
      return response.res(result)
    } catch (e) {
      Logger.error(e)
      throw new HttpException(e.message, 400)
    }
  }

  async removeKnock({ request, auth, response }) {
    const { estate_id } = request.all()
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

  async matchMoveToNewEstate({ request, auth, response }) {
    const { estate_id, user_id, new_estate_id } = request.all()

    try {
      await MatchService.matchMoveToNewEstate({
        estateId: estate_id,
        userId: user_id,
        newEstateId: new_estate_id,
        landlordId: auth.user.id
      })
      return response.res(true)
    } catch (e) {
      throw new HttpException(e.message, e.status || 400, e.code || 0)
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
    const estate = await EstateService.getMatchEstate(estate_id, landlordId)
    const trx = await Database.beginTransaction()
    try {
      await MatchService.inviteKnockedUser({ estate, userId: user_id }, trx)
      await trx.commit()
      logEvent(
        request,
        LOG_TYPE_INVITED,
        auth.user.id,
        { estate_id, tenant_id: user_id, role: ROLE_LANDLORD },
        false
      )
      logEvent(request, LOG_TYPE_GOT_INVITE, user_id, { estate_id, role: ROLE_USER }, false)
      Event.fire('mautic:syncContact', auth.user.id, { invited_count: 1 })
      return response.res(true)
    } catch (e) {
      await trx.rollback()
      Logger.error(e)
      throw new HttpException(e.message, e?.status || 400, e?.code || 0)
    }
  }

  /**
   * Landlord
   * If user invited but need to rollback
   */
  async removeInvite({ request, auth, response }) {
    const { estate_id, user_id } = request.all()
    await EstateService.getMatchEstate(estate_id, auth.user.id)

    try {
      await MatchService.cancelInvite(estate_id, user_id, auth.user.role)
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
      await MatchService.cancelInvite(estate_id, auth.user.id, auth.user.role)
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
      logEvent(request, LOG_TYPE_VISITED, userId, { estate_id, role: ROLE_USER }, false)
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
   * Not coming/cancel visit by landloard
   *
   */
  async cancelVisitByLandlord({ request, auth, response }) {
    const { estate_id, tenant_id } = request.all()

    try {
      await MatchService.cancelVisitByLandlord(estate_id, tenant_id)
      return response.res(true)
    } catch (e) {
      Logger.error(e)
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400)
      }
      throw e
    }
  }

  async inviteTenantToEstate({ request, auth, response }) {
    const { estate_id, tenant_id, invite_to } = request.all()
    try {
      const currentTenant = await MatchService.findCurrentTenant(estate_id, tenant_id)
      if (currentTenant) {
        await MatchService.invitedTenant(estate_id, tenant_id, invite_to)
        if (invite_to === TENANT_EMAIL_INVITE) {
          const shortLink = await createDynamicLink(
            `${process.env.DEEP_LINK}?type=tenantinvitation&user_id=${tenant_id}&estate_id=${estate_id}`
          )
          MailService.sendInvitationToTenant(currentTenant.email, shortLink)
        } else {
        }
        response.res(true)
      }
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async removeTenantEdit({ request, auth, response }) {
    const { estate_id, tenant_id } = request.all()
    const result = await MatchService.invitedTenant(estate_id, tenant_id, null)
    response.res(true)
  }

  async updateProperty({ request, auth, response }) {
    const { estate_id, properties, prices } = request.all()

    try {
      const match = await MatchService.hasPermissionToEditProperty(estate_id, auth.user.id)
      await MatchService.addTenantProperty({
        estate_id,
        user_id: auth.user.id,
        properties,
        prices
      })
      response.res(true)
    } catch (e) {
      throw new HttpException('No permission to edit', 400)
    }
  }

  async deleteProperty({ request, auth, response }) {
    const { estate_id } = request.all()
    try {
      await MatchService.addTenantProperty({
        estate_id,
        user_id: auth.user.id,
        properties: null,
        prices: null
      })
      response.res(true)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async inviteTenantInToVisit({ request, auth, response }) {
    const { estate_id, tenant_id } = request.all()
    try {
      await MatchService.updateVisitIn(estate_id, tenant_id)
      await MatchService.inviteTenantInToVisit(estate_id, tenant_id)
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
    const { estate_id, status, delay = null, user_id } = request.all()
    const estate = await EstateService.getMatchEstate(estate_id, auth.user.id)
    if (!estate) {
      throw new HttpException('Invalid estate', 404)
    }

    await MatchService.updateVisitStatusLandlord(estate_id, user_id, {
      lord_status: status,
      lord_delay: delay || 0
    })

    return response.res(true)
  }

  async followupVisit({ request, auth, response }) {
    const { estate_id, user_id } = request.all()
    try {
      const meta = await VisitService.followupVisit(estate_id, user_id, auth)
      return response.res(true)
    } catch (err) {
      throw new HttpException(err.message, 422)
    }
  }

  async getFollowups({ request, auth, response }) {
    const { estate_id, user_id } = request.all()
    try {
      const meta = await VisitService.getFollowupMeta(estate_id, user_id)
      return response.res({
        estate_id,
        user_id,
        followupsMade: isNull(meta) ? [] : JSON.stringify(meta)
      })
    } catch (err) {
      throw new HttpException(err.message, 422)
    }
  }

  /**
   *
   */
  async updateVisitTimeslotTenant({ request, auth, response }) {
    const { estate_id, status, delay = null } = request.all()

    await MatchService.updateVisitStatus(estate_id, auth.user.id, {
      tenant_status: status,
      tenant_delay: delay
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
    await EstateService.getMatchEstate(estate_id, userId)

    try {
      const { tenantId } = await MatchService.share({
        landlord_id: userId,
        estate_id,
        code
      })
      logEvent(
        request,
        LOG_TYPE_SHOWED,
        auth.user.id,
        { tenant_id: tenantId, estate_id, role: ROLE_LANDLORD },
        false
      )
      Event.fire('mautic:syncContact', auth.user.id, { showedproperty_count: 1 })
      return response.res({ user_id: tenantId })
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
    const trx = await Database.beginTransaction()
    try {
      await EstateService.getMatchEstate(estate_id, auth.user.id)
      const success = await MatchService.toTop(
        {
          estateId: estate_id,
          tenantId: user_id,
          landlordId: auth.user.id
        },
        trx
      )
      if (!success) {
        throw new HttpException('Cant move to top', 400)
      }
      await trx.commit()
      NoticeService.landlordMovedProspectToTop(estate_id, user_id)
      response.res(true)
    } catch (e) {
      await trx.rollback()
      console.log('moveUserToTop', e.message)
      throw new HttpException(e.message, e.status || 400)
    }
  }

  async cancelTopByTenant({ request, auth, response }) {
    const tenantId = auth.user.id
    const { estate_id } = request.all()
    try {
      await MatchService.cancelTopByTenant(estate_id, tenantId)
      response.res(true)
    } catch (e) {
      throw new HttpException('Cant cancel top', 400)
    }
  }

  /**
   * Landlord
   * Discard user move to Top list
   */
  async discardUserToTop({ request, auth, response }) {
    const { user_id, estate_id } = request.all()
    await EstateService.getMatchEstate(estate_id, auth.user.id)
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
    await EstateService.getMatchEstate(estate_id, auth.user.id)

    const finalMatch = await MatchService.getFinalMatch(estate_id)
    if (finalMatch) {
      throw new HttpException('There is a final match for that property', 400)
    }
    if (!(await MatchService.canRequestFinalCommit(estate_id))) {
      throw new HttpException(ERROR_MATCH_COMMIT_DOUBLE, 400, ERROR_MATCH_COMMIT_DOUBLE_CODE)
    }
    const isValidMatch = await MatchService.checkMatchIsValidForFinalRequest(estate_id, user_id)

    const trx = await Database.beginTransaction()

    if (!isValidMatch) {
      throw new HttpException(
        'This prospect has not shared the data. Match is not valid for final match request',
        400
      )
    }

    try {
      await MatchService.requestFinalConfirm({ estateId: estate_id, tenantId: user_id }, trx)
      logEvent(
        request,
        LOG_TYPE_FINAL_MATCH_REQUEST,
        auth.user.id,
        { estate_id, tenant_id: user_id, role: ROLE_LANDLORD },
        false
      )
      await trx.commit()
      Event.fire('mautic:syncContact', user_id, { finalmatchrequest_count: 1 })
      response.res(true)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  async tenantCancelCommit({ request, auth, response }) {
    try {
      const { estate_id } = request.all()
      await MatchService.tenantCancelCommit(estate_id, auth.user.id)
      response.res(true)
    } catch (e) {
      Logger.error(e)
      throw new HttpException(e.message, e.status || 400)
    }
  }

  /**
   * Tenant
   * Accept rent
   */
  async commitEstateRent({ request, auth, response }) {
    const { estate_id } = request.all()

    try {
      const { estate, contact } = await MatchService.finalConfirm(estate_id, auth.user)
      logEvent(
        request,
        LOG_TYPE_FINAL_MATCH_APPROVAL,
        auth.user.id,
        { estate_id, role: ROLE_USER },
        false
      )
      response.res({ estate, contact })
    } catch (e) {
      Logger.error(e)
      throw new HttpException(e.message, e.status || 500)
    }
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

    const params = { isShort: true, fields: TENANT_MATCH_FIELDS }
    let estates = orderBy(
      (await MatchService.getTenantMatchesWithFilterQuery(user.id, filters).fetch()).toJSON(),
      'updated_at',
      'desc'
    )

    let thirdPartyOffers = []
    if (filters && (filters.knock || filters.like || filters.dislike)) {
      thirdPartyOffers = await ThirdPartyOfferService.getTenantEstatesWithFilter(user.id, filters)
    }

    estates = [...estates, ...thirdPartyOffers]

    let estateData = uniqWith(
      estates,
      (obj1, obj2) => obj1.id === obj2.id && obj1.inside === obj2.inside
    )

    /**
     * if a tenant invites outside landlord and create a task, need to add pending final match until a landlord accepts invitation
     * this final pending has to be removed if a landlord assigns that task to a specific property
     */
    if (filters && filters.final) {
      const pendingEstates = await EstateService.getPendingFinalMatchEstate(user.id)
      estates = [...estates, ...pendingEstates]
      estateData = [...estateData, ...pendingEstates]
    }

    estateData = estateData.sort((a, b) => (a?.status_at > b?.status_at ? -1 : 1))

    const startIndex = ((page || 1) - 1) * (limit || 999)
    const endIndex = startIndex + (limit || 999)

    estates = {
      total: estateData.length,
      lastPage: Math.ceil(estateData.length / limit),
      page,
      perPage: limit,
      data: estateData.slice(startIndex, endIndex)
    }

    if (filters?.dislike) {
      const trashEstates = await EstateService.getTenantTrashEstates(user.id)
      estates = {
        data: estates.data.concat(trashEstates.toJSON(params)),
        perPage: 9999,
        page: 1,
        lastPage: 1
      }
      estates.total = estates.data.length
    }

    return response.res({
      ...estates,
      tab: currentTab
    })
  }

  async getTenantTopMatchesByEstate(estateId, tenantId) {
    const estate = await MatchService.getTenantTopMatchesByEstate(estateId, tenantId)

    if (!estate) {
      throw new HttpException('Estate not found', 404)
    }

    return estate
  }

  async getMatchByEstate({ request, auth, response }) {
    const { estate_id } = request.all()
    response.res(await MatchService.getMatches(auth.user.id, estate_id))
  }

  async checkTenantMatchCommitedAlready({ request, auth, response }) {
    const { estate_id } = request.all()
    const { id } = auth.user
    await this.getTenantTopMatchesByEstate(estate_id, id)
    response.res(200)
  }

  async getTenantUpcomingVisits({ auth, response }) {
    const estates = await MatchService.getTenantUpcomingVisits(auth.user.id).paginate(1, 999999)
    const fields = TENANT_MATCH_FIELDS

    return response.res({
      ...estates.toJSON({ isShort: true, fields })
    })
  }

  async getLandlordUpcomingVisits({ auth, response }) {
    const estates = await MatchService.getLandlordUpcomingVisits(auth.user.id)
    return response.res(estates.toJSON())
  }

  async getMatchesCountsTenant({ auth, response }) {
    const userId = auth.user.id
    const counts = await MatchService.getMatchesCountsTenant(userId)
    return response.res(counts)
  }

  async getMatchesStageCountsTenant({ request, auth, response }) {
    const userId = auth.user.id
    const { filter } = request.all()
    const counts = await MatchService.getMatchesStageCountsTenant(filter, userId)
    return response.res(counts)
  }

  async searchForTenant({ request, auth, response }) {
    const { limit, page, ...params } = request.all()
    let estates = await MatchService.searchForTenant(auth.user.id, params).paginate(1, 999999)
    const fields = TENANT_MATCH_FIELDS

    estates = {
      ...estates.toJSON({ isShort: true, fields })
    }

    if (estates?.data) {
      estates.data = await Promise.all(
        estates.data.map(async (estate) => {
          estate.isoline = await EstateService.getIsolines(estate)
          return estate
        })
      )
    }

    return response.res(estates)
  }

  async searchForLandlord({ request, auth, response }) {
    const { query } = request.all()
    let estates = await MatchService.searchForLandlord(auth.user.id, query)
    estates = estates.rows

    estates = await Promise.all(
      estates.map(async (estate) => {
        estate.isoline = await EstateService.getIsolines(estate)
        return estate
      })
    )

    return response.res(estates)
  }

  async getLandlordSummary({ request, auth, response }) {
    const user = auth.user
    try {
      const allEstates = await Estate.query()
        .where('user_id', user.id)
        .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE, STATUS_OFFLINE_ACTIVE])
        .select(['id', 'available_start_at', 'available_end_at', 'status'])
        .select('available_start_at', 'available_end_at')
        .fetch()

      const allEstatesJson = allEstates.toJSON({ isOwner: true })

      const allEstatesCount = allEstatesJson.length

      const matchedEstates = await Estate.query()
        .select('estates.id')
        .select('estates.user_id')
        .select('estates.status')
        .where('estates.user_id', user.id)
        .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE, STATUS_OFFLINE_ACTIVE])
        .innerJoin('matches', 'matches.estate_id', 'estates.id')
        .select('matches.status as match_status')
        .select('matches.buddy')
        .fetch()
      const matchedEstatesJson = matchedEstates.toJSON()

      const groupedEstates = []

      matchedEstatesJson.map(({ id, match_status }) => {
        const index = groupedEstates.findIndex((e) => e.id === id)
        if (index !== -1) {
          if (groupedEstates[index][match_status]) {
            groupedEstates[index][match_status] += 1
          } else {
            groupedEstates[index][match_status] = 1
          }
        } else {
          groupedEstates.push({
            id,
            [match_status]: 1
          })
        }
      })

      let groupedFilteredEstates = [...groupedEstates]
      const removeFiltereds = (allEstates, filteredEstates) => {
        filteredEstates.map((estate) => {
          const index = allEstates.findIndex((e) => e.id === estate.id)
          allEstates.splice(index, 1)
        })
        return allEstates
      }

      const filters = [
        { value: MATCH_STATUS_COMMIT, key: 'commits' },
        { value: MATCH_STATUS_TOP, key: 'top' },
        { value: MATCH_STATUS_SHARE, key: 'sharedVisits' },
        { value: MATCH_STATUS_VISIT, key: 'visits' },
        { value: MATCH_STATUS_INVITE, key: 'invites' },
        { value: MATCH_STATUS_KNOCK, key: 'matches' }
      ]

      const counts = {}
      counts.totalEstates = allEstatesCount

      filters.map((filter) => {
        const estates = groupedFilteredEstates.filter((e) => e[filter.value])
        groupedFilteredEstates = removeFiltereds(groupedFilteredEstates, estates)
        counts[filter.key] = estates.length
      })

      const buddies = groupedFilteredEstates.filter(
        (e) => e.match_status === MATCH_STATUS_NEW && e.buddy === true
      )
      groupedFilteredEstates = removeFiltereds(groupedFilteredEstates, buddies)
      counts.buddies = buddies.length

      // const newMatchedEstatesCount = groupedFilteredEstates.length
      // const nonMatchedEstatesCount = allEstatesCount - groupedEstates.length

      counts.totalVisits = counts.visits + counts.invites + counts.sharedVisits
      counts.totalDecided = counts.top + counts.commits
      // counts.totalInvite =
      //   counts.matches + counts.buddies + newMatchedEstatesCount + nonMatchedEstatesCount

      counts.totalInvite = counts.matches + counts.buddies

      const currentDay = moment().utc().startOf('day')

      counts.expired = allEstatesJson.filter((e) => e.status === STATUS_EXPIRE).length

      const showed = await Estate.query()
        .where({ user_id: user.id })
        .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE, STATUS_OFFLINE_ACTIVE])
        .whereHas('slots', (estateQuery) => {
          estateQuery.where('end_at', '<=', currentDay.format(DATE_FORMAT))
        })
        .count()

      counts.showed = parseInt(showed[0].count || 0)

      const finalMatches = await Estate.query()
        .where({ user_id: user.id })
        .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE, STATUS_DRAFT, STATUS_OFFLINE_ACTIVE])
        .whereHas('matches', (query) => {
          query.where('status', MATCH_STATUS_FINISH)
        })
        .count()

      counts.finalMatches = parseInt(finalMatches[0].count || 0)

      const excludeIds = uniq(
        matchedEstatesJson
          .filter(
            (e) =>
              e.match_status === MATCH_STATUS_KNOCK ||
              (e.match_status === MATCH_STATUS_NEW && e.buddy)
          )
          .map((e) => e.id)
      )

      counts.contact_requests =
        await require('../../Services/EstateService').getEstatePendingKnockRequestCount({
          user_id: user.id,
          excludeIds
        })

      return response.res(counts)
    } catch (e) {
      Logger.error(e)
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400)
      }
      throw e
    }
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
    const fields = ['buddy', 'date', 'user_id', 'visit_status', 'delay', 'updated_at', 'status_at']
    const extraFields = filters.commit ? ['email', 'phone', 'last_address', ...fields] : fields

    const data = tenants.toJSON({ isShort: true, extraFields })
    // Add avatar path to data
    data.data = data.data.map((i) => ({ ...i, avatar: File.getPublicUrl(i.avatar) }))

    return response.res({
      ...data,
      tab: currentTab
    })
  }

  /**
   * Get All matches user for estate
   */
  async getMatchesSummaryLandlordEstate({ request, auth, response }) {
    const user = auth.user
    // filters = { knock, buddy, invite, visit, top, commit }
    let filters = {}
    const { estate_id, page, limit, ...params } = request.all()
    if (!page) {
      throw new HttpException('Page param is required')
    }

    const query =
      auth.current.user instanceof Admin
        ? { id: estate_id }
        : {
            id: estate_id,
            'estates.user_id': user.id
          }

    const estate = await EstateService.getQuery(query).with('slots').first()

    if (!estate) {
      throw new HttpException('Not found', 400)
    }
    const estatesId = [estate_id]
    let data

    const fields = [
      'buddy',
      'date',
      'user_id',
      'visit_status',
      'visit_start_date',
      'visit_end_date',
      'visit_confirmation_date',
      'delay',
      'u_status',
      'updated_at',
      'inviteIn',
      'income',
      'followups',
      'u_firstname',
      'u_secondname',
      'u_birthday',
      'u_avatar',
      'final_match_date',
      'status_at',
      'unread_count',
      'credit_history_status',
      'email',
      'phone',
      'last_address',
      'is_activated'
    ]

    const matchCount = await MatchService.getCountLandlordMatchesWithFilterQuery(
      estate,
      (filters = { knock: true }),
      { ...params }
    )

    let knockedFactorCounts
    if (matchCount) {
      knockedFactorCounts = await MatchService.getMatchesByFilter(
        estate,
        { knock: true },
        { ...params }
      )
    }

    // @TODO: performance (bad db performance)
    // step one load all global tasks for estate
    // get unread message count for taskId list
    // access that data later
    const getUnreadMessagesCount = async (estateId, tenantId) => {
      const taskId = await TaskService.getGlobalTaskByEstateIdAndTenantId({ tenantId, estateId })
      if (taskId) {
        const unreadMessages = await ChatService.getUnreadMessagesCount(taskId, user.id)
        console.log({ unreadMessages })
        return unreadMessages
      }
      return null
    }

    const matchSortFunction = (a, b) =>
      b.percent - a.percent || b.is_activated - a.is_activated || b.income - a.income
    let tenants = await MatchService.getLandlordMatchesWithFilterQuery(
      estate,
      (filters = { knock: true }),
      { ...params }
    ).paginate(page, limit || 10)
    const extraFields = [...fields]
    data = tenants.toJSON({ isShort: true, extraFields })
    data.data = await Promise.map(
      data.data,
      async (i) => ({
        ...i,
        avatar: File.getPublicUrl(i.avatar),
        unread_messages: await getUnreadMessagesCount(estate_id, i.user_id)
      }),
      { concurrency: 1 }
    )
    data.data = data.data.sort(matchSortFunction)

    const contact_request_count = (
      await require('../../Services/MarketPlaceService')
        .getPendingKnockRequestCountQuery({
          estate_id
        })
        .count()
    )?.[0]?.count

    const contactRequestSortFunction = (a, b) => b.income - a.income
    const contact_requests_data = (
      await require('../../Services/MarketPlaceService')
        .getPendingKnockRequestQuery({
          estate_id
        })
        .paginate(page, limit || 10)
    ).toJSON()
    contact_requests_data.data = contact_requests_data.data.sort(contactRequestSortFunction)

    const contact_requests = {
      ...contact_requests_data,
      total: contact_request_count,
      lastPage: Math.ceil(contact_request_count / contact_requests_data.perPage)
    }

    data = {
      ...data,
      total: matchCount[0].count,
      lastPage: Math.ceil(matchCount[0].count / data.perPage),
      ...knockedFactorCounts
    }
    const matches = data

    // Buddies
    const buddyCount = await MatchService.getCountLandlordMatchesWithFilterQuery(
      estate,
      (filters = { buddy: true }),
      { ...params }
    )

    let buddyFactorCounts = {}
    if (buddyCount) {
      buddyFactorCounts = await MatchService.getMatchesByFilter(
        estate,
        { buddy: true },
        { ...params }
      )
    }

    tenants = await MatchService.getLandlordMatchesWithFilterQuery(
      estate,
      (filters = { buddy: true }),
      { ...params }
    ).paginate(page, limit || 10)

    data = tenants.toJSON({ isShort: true, extraFields })
    data.data = await Promise.map(
      data.data,
      async (i) => ({
        ...i,
        avatar: File.getPublicUrl(i.avatar),
        unread_messages: await getUnreadMessagesCount(estate_id, i.user_id)
      }),
      { concurrency: 1 }
    )
    data.data = data.data.sort(matchSortFunction)
    data = {
      ...data,
      total: buddyCount[0].count,
      lastPage: Math.ceil(buddyCount[0].count / data.perPage),
      ...buddyFactorCounts
    }

    const buddies = data

    // Invites
    const inviteCount = await MatchService.getCountLandlordMatchesWithFilterQuery(
      estate,
      (filters = { invite: true })
    )
    tenants = await MatchService.getLandlordMatchesWithFilterQuery(
      estate,
      (filters = { invite: true })
    ).paginate(page, limit || 10)

    data = tenants.toJSON({ isShort: true, extraFields })
    data.data = await Promise.map(
      data.data,
      async (i) => ({
        ...i,
        avatar: File.getPublicUrl(i.avatar),
        unread_messages: await getUnreadMessagesCount(estate_id, i.user_id)
      }),
      { concurrency: 1 }
    )
    data.data = data.data.sort(matchSortFunction)
    data = {
      ...data,
      total: inviteCount[0].count,
      lastPage: Math.ceil(inviteCount[0].count / data.perPage)
    }

    const invites = data

    // Visits
    const visitCount = await MatchService.getCountLandlordMatchesWithFilterQuery(
      estate,
      (filters = { visit: true })
    )
    tenants = await MatchService.getLandlordMatchesWithFilterQuery(
      estate,
      (filters = { visit: true })
    ).paginate(page, limit || 10)

    data = tenants.toJSON({ isShort: true, extraFields })
    data.data = await Promise.map(
      data.data,
      async (i) => ({
        ...i,
        avatar: File.getPublicUrl(i.avatar),
        unread_messages: await getUnreadMessagesCount(estate_id, i.user_id)
      }),
      { concurrency: 1 }
    )
    data.data = data.data.sort(matchSortFunction)
    data = {
      ...data,
      total: visitCount[0].count,
      lastPage: Math.ceil(visitCount[0].count / data.perPage)
    }

    const visits = data

    // Top
    const topCount = await MatchService.getCountLandlordMatchesWithFilterQuery(
      estate,
      (filters = { top: true })
    )

    tenants = await MatchService.getLandlordMatchesWithFilterQuery(
      estate,
      (filters = { top: true })
    ).paginate(page, limit || 10)

    data = tenants.toJSON({ isShort: true, fields })
    data.data = await Promise.map(
      data.data,
      async (i) => ({
        ...i,
        avatar: File.getPublicUrl(i.avatar),
        unread_messages: await getUnreadMessagesCount(estate_id, i.user_id)
      }),
      { concurrency: 1 }
    )
    data.data = data.data.sort(matchSortFunction)
    data = {
      ...data,
      total: topCount[0].count,
      lastPage: Math.ceil(topCount[0].count / data.perPage)
    }

    const top = data

    let isFinalMatch = false
    const finalMatchesCount = await Database.table('matches')
      .count('*')
      .whereIn('status', [MATCH_STATUS_FINISH])
      .whereIn('estate_id', estatesId)

    if (finalMatchesCount && finalMatchesCount.length && parseInt(finalMatchesCount[0].count) > 0) {
      isFinalMatch = true
    }

    const filter = isFinalMatch ? { final: true } : { commit: true }

    const finalCount = await MatchService.getCountLandlordMatchesWithFilterQuery(
      estate,
      (filters = filter)
    )

    tenants = await MatchService.getLandlordMatchesWithFilterQuery(
      estate,
      (filters = filter)
    ).paginate(page, limit || 10)

    data = tenants.toJSON({ isShort: true, extraFields })
    data.data = await Promise.map(
      data.data,
      async (i) => ({
        ...i,
        avatar: File.getPublicUrl(i.avatar),
        unread_messages: await getUnreadMessagesCount(estate_id, i.user_id)
      }),
      { concurrency: 1 }
    )
    data.data = data.data.sort(matchSortFunction)
    data = {
      ...data,
      total: finalCount[0].count,
      lastPage: Math.ceil(finalCount[0].count / data.perPage)
    }

    const finalMatches = data
    return response.res({
      estate: estate.toJSON(),
      matches,
      buddies,
      invites,
      visits,
      top,
      finalMatches,
      contact_requests
    })
  }

  async notifyProspectsToFillUpProfile({ request, auth, response }) {
    const { emails } = request.all()
    try {
      // FIXME: filter valid emails:
      // 1. when match must not be activated yet
      // 2. when from contact requests
      await MailService.sendToProspectForFillUpProfile({
        email: emails
      })
      response.res(true)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
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
    await EstateService.getMatchEstate(estate_id, auth.user.id)
    await MatchService.inviteUserToCome(estate_id, user_id)

    response.res(true)
  }

  async getMatchStageList({ request, auth, response }) {
    const { page, limit, ...params } = request.post()
    const result = await MatchService.getMatchStageList({
      user_id: auth.user.id,
      params,
      page: page || -1,
      limit: limit || -1
    })
  }

  async getMatchList({ request, auth, response }) {
    const { ...params } = request.all()
    const inLetMatches = await MatchService.getMatchList(auth.user.id, params)
    const inLetMatchCount = await MatchService.getCountMatchList(auth.user.id, {
      letting_status: [
        LETTING_STATUS_TERMINATED,
        LETTING_STATUS_VACANCY,
        LETTING_STATUS_NEW_RENOVATED
      ],
      status: [STATUS_ACTIVE, STATUS_EXPIRE]
    })
    const finalMatchCount = await MatchService.getCountMatchList(auth.user.id, {
      letting_type: [LETTING_TYPE_LET],
      letting_status: [LETTING_STATUS_STANDARD],
      status: [STATUS_DRAFT]
    })
    const prepareCount = await MatchService.getCountMatchList(auth.user.id, {
      letting_status: [
        LETTING_STATUS_TERMINATED,
        LETTING_STATUS_VACANCY,
        LETTING_STATUS_NEW_RENOVATED
      ],
      status: [STATUS_DRAFT]
    })

    response.res({
      matches: inLetMatches,
      counts: {
        match: inLetMatchCount[0].count,
        final: finalMatchCount[0].count,
        preparation: prepareCount[0].count
      }
    })
  }

  async getInviteList({ request, auth, response }) {
    const { estate_id, query, buddy, invite } = request.all()
    const result = await MatchService.getInviteList({
      user_id: auth.user.id,
      estate_id,
      query,
      buddy,
      invite
    })
    response.res(result)
  }

  async postThirdPartyOfferAction({ request, auth, response }) {
    const { action, id, comment, message } = request.all()
    try {
      const result = await ThirdPartyOfferService.postAction(
        auth.user.id,
        id,
        action,
        comment,
        message
      )
      return response.res(result)
    } catch (err) {
      console.log(err)
      throw new HttpException(err.message, 400)
    }
  }

  async getKnockPlacesNumber({ request, auth, response }) {
    const { estate_id } = request.all()
    try {
      response.res(await MatchService.getKnockedPosition({ user_id: auth.user.id, estate_id }))
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async cancelAction({ request, auth, response }) {
    const { estate_id, user_id, action } = request.all()
    try {
      const Match = use('App/Models/Match')
      const match = await Match.query()
        .where('user_id', user_id)
        .where('estate_id', estate_id)
        .first()
      if (!match) {
        throw new Error('Cannot cancel action. User not matched with estate.')
      }
      switch (action) {
        case 'knock':
          await Match.query()
            .where('user_id', user_id)
            .where('estate_id', estate_id)
            .update({ status: MATCH_STATUS_NEW })
          break
        case 'like':
        case 'dislike':
          const table = `${action}s`
          await Database.table(table)
            .where('user_id', user_id)
            .where('estate_id', estate_id)
            .delete()
          break
      }
      response.res(true)
    } catch (err) {
      throw new HttpException(err.message, 400)
    }
  }

  async cancelBuildingAction({ request, auth, response }) {
    const { building_id, user_id, action } = request.all()
    try {
      const Match = use('App/Models/Match')
      const matches = await Match.query()
        .select(Database.raw(`matches.id as match_id, matches.estate_id`))
        .leftJoin('estates', 'estates.id', 'matches.estate_id')
        .where('matches.user_id', user_id)
        .where('estates.build_id', building_id)
        .fetch()

      if (matches.toJSON().length < 1) {
        throw new Error('Cannot cancel action. User not matched with building.')
      }
      const estate_ids = (matches.toJSON() || []).map((match) => match.estate_id)
      switch (action) {
        case 'knock':
          await Match.query()
            .where('user_id', user_id)
            .whereIn('estate_id', estate_ids)
            .update({ status: MATCH_STATUS_NEW })
          break
        case 'like':
        case 'dislike':
          const table = `${action}s`
          await Database.table(table)
            .where('user_id', user_id)
            .whereIn('estate_id', estate_ids)
            .delete()
          break
      }
      response.res(true)
    } catch (err) {
      throw new HttpException(err.message, 400)
    }
  }

  async requestTenantToShareProfile({ request, auth, response }) {
    const userId = auth.user.id
    const { prospectId, date, estateId } = request.all()
    try {
      await MatchService.requestTenantToShareProfile(prospectId, userId, date, estateId)
      logEvent(request, LOG_TYPE_REQUEST_PROFILE, userId, { prospectId, role: ROLE_USER }, false)
      return response.res(true)
    } catch (e) {
      Logger.error(e)
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400)
      }
      throw e
    }
  }

  async prospectRespondToProfileSharingRequest({ request, auth, response }) {
    const userId = auth.user.id
    const { estateId, profileStatus } = request.all()
    try {
      await MatchService.prospectRespondToProfileSharingRequest(userId, estateId, profileStatus)
      return response.res(true)
    } catch (e) {
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400)
      }
      throw e
    }
  }

  async contactMultiple({ request, auth, response }) {
    const { mode, estate_id, recipients, message } = request.all()
    const estate = await Estate.query()
      .whereNot('status', STATUS_DELETE)
      .where('id', estate_id)
      .where('user_id', auth.user.id)
      .first()
    if (!estate) {
      throw new HttpException(ESTATE_NOT_EXISTS, 404)
    }
    switch (mode) {
      case 'chat':
        const trx = await Database.beginTransaction()
        try {
          await Promise.map(
            recipients,
            async (recipientId) => {
              const task = await TaskService.getTaskById({
                estate_id,
                prospect_id: recipientId,
                user: auth.user
              })
              if (!task) {
                throw new HttpException(NO_TASK_FOUND, 400)
              }
              const recipient = await User.query().where('id', recipientId).first()
              const chat = await ChatService.save(
                { message, user_id: auth.user.id, task_id: task.id },
                trx
              )
              await TaskService.updateUnreadMessageCount(
                { task_id: task.id, role: auth.user.role, chat_id: chat.id },
                trx
              )

              const messageReceivedData = {
                topic: `task:${estate_id}brz${task.id}`,
                message,
                urgency: task?.urgency,
                estate_id,
                user_id: recipient.id,
                property_id: estate?.property_id,
                sender: {
                  id: auth.user.id,
                  firstname: auth.user.firstname,
                  secondname: auth.user.secondname,
                  avatar: auth.user.avatar
                }
              }
              // send to tenant:user_id
              WebSocket.publishToTenant({
                event: 'taskMessageReceived',
                userId: recipient.id,
                data: messageReceivedData
              })
              const data = {
                message: {
                  id: chat.id,
                  message: chat.text,
                  attachments: null,
                  topic: `task:${estate_id}brz${task.id}`,
                  dateTime: moment.utc(new Date()).format(),
                  sender: {
                    id: auth.user.id,
                    firstname: auth.user.firstname,
                    secondname: auth.user.secondname,
                    avatar: auth.user.avatar
                  }
                },
                sender: {
                  userId: auth.user.id,
                  firstname: auth.user.firstname,
                  secondname: auth.user.secondname,
                  avatar: auth.user.avatar
                },
                topic: `task:${estate_id}brz${task.id}`
              }
              // send to task:{estate_id}brz{task_id}
              WebSocket.publishToTask({
                event: 'message',
                taskId: task.id,
                estateId: estate_id,
                data: {
                  ...data,
                  broadcast_all: true
                }
              })
              // send to push notification and basic notification
              NoticeService.notifyTaskMessageSent(recipient.id, chat.text, task.id, auth.user.role)
              // send to email
              await MailService.sendToProspectThatLandlordSentMessage({
                email: recipient.email,
                message: chat.text,
                recipient,
                lang: recipient.lang || DEFAULT_LANG,
                estate_id,
                estate,
                task_id: task.id,
                type: task.type,
                topic: `task:${estate_id}brz${task.id}`
              })
            },
            { concurrency: 1 }
          )
          await trx.commit()
          return response.res(true)
        } catch (err) {
          console.log(err.message)
          await trx.rollback()
          throw new HttpException('Error sending chat.')
        }
        break
      case 'email':
        const users = await User.query().whereIn('id', recipients).fetch()
        const email = (users.toJSON({ isOwner: true }) || []).map((user) => user.email)
        if (email.length) {
          await MailService.sendToProspectThatLandlordSentMessage(
            {
              email,
              message,
              estate_id,
              estate,
              lang: DEFAULT_LANG
            },
            'LANDLORD_SEND_MULTIPLE_MATCH_MESSAGE'
          )
        }
        return response.res(true)
    }
  }
}

module.exports = MatchController
