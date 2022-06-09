'use strict'

const uuid = require('uuid')
const moment = require('moment')

const Event = use('Event')
const Logger = use('Logger')
const Estate = use('App/Models/Estate')
const Member = use('App/Models/Member')
const File = use('App/Models/File')
const FileBucket = use('App/Classes/File')
const EstateService = use('App/Services/EstateService')
const MatchService = use('App/Services/MatchService')
const ImportService = use('App/Services/ImportService')
const TenantService = use('App/Services/TenantService')
const MemberService = use('App/Services/MemberService')
const CompanyService = use('App/Services/CompanyService')
const EstatePermissionService = use('App/Services/EstatePermissionService')
const HttpException = use('App/Exceptions/HttpException')
const Drive = use('Drive')
const User = use('App/Models/User')
const Amenity = use('App/Models/Amenity')
const EstateViewInvite = use('App/Models/EstateViewInvite')
const EstateViewInvitedEmail = use('App/Models/EstateViewInvitedEmail')
const EstateViewInvitedUser = use('App/Models/EstateViewInvitedUser')
const Database = use('Database')
const randomstring = require('randomstring')
const l = use('Localize')

const {
  STATUS_ACTIVE,
  STATUS_EXPIRE,
  STATUS_DRAFT,
  STATUS_DELETE,
  ERROR_BUDDY_EXISTS,
  DATE_FORMAT,
  DAY_FORMAT,
  MATCH_STATUS_NEW,
  PROPERTY_MANAGE_ALLOWED,
  ROLE_PROPERTY_MANAGER,
  MATCH_STATUS_FINISH,
  LOG_TYPE_PROPERTIES_IMPORTED,
  ROLE_USER,
  LETTING_TYPE_LET,
  LETTING_TYPE_VOID,
  TRANSPORT_TYPE_WALK
} = require('../../constants')
const { logEvent } = require('../../Services/TrackingService')
const { isEmpty, isFunction, isNumber, pick } = require('lodash')
const EstateAttributeTranslations = require('../../Classes/EstateAttributeTranslations')
const EstateFilters = require('../../Classes/EstateFilters')
const GeoService = use('App/Services/GeoService')
const INVITE_CODE_STRING_LENGTH = 8

class EstateController {
  async createEstateByPM({ request, auth, response }) {
    const data = request.all()
    const landlordIds = await EstatePermissionService.getLandlordIds(
      auth.user.id,
      PROPERTY_MANAGE_ALLOWED
    )

    if (landlordIds.includes(data.landlord_id)) {
      const estate = await EstateService.createEstate(request, data.landlord_id)
      response.res(estate)
    } else {
      throw new HttpException('Not Allowed', 400)
    }
  }

  /**
   *
   */
  async createEstate({ request, auth, response }) {
    const estate = await EstateService.createEstate(request, auth.user.id)
    response.res(estate)
  }

  async updateEstateByPM({ request, auth, response }) {
    const { id, ...data } = request.all()

    const landlordIds = await EstatePermissionService.getLandlordIds(
      auth.user.id,
      PROPERTY_MANAGE_ALLOWED
    )
    try {
      const estate = await Estate.findOrFail(id)

      if (!estate || !landlordIds.includes(estate.user_id)) {
        throw new HttpException('Not allow', 403)
      }

      const newEstate = await EstateService.updateEstate(request)
      response.res(newEstate)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }
  /**
   *
   */
  async updateEstate({ request, auth, response }) {
    const { id, ...data } = request.all()
    const estate = await Estate.findOrFail(id)
    if (estate.user_id !== auth.user.id) {
      throw new HttpException('Not allow', 403)
    }

    const newEstate = await EstateService.updateEstate(request)
    response.res(newEstate)
  }

  async lanlordTenantDetailInfo({ request, auth, response }) {
    const { estate_id, tenant_id } = request.all()
    try {
      const lanlord = await EstateService.lanlordTenantDetailInfo(
        auth.user.id,
        estate_id,
        tenant_id
      )
      let tenant = await TenantService.getTenant(tenant_id)
      let members = await MemberService.getMembers(tenant_id)
      const company = await CompanyService.getUserCompany(auth.user.id)
      if (!lanlord.toJSON().share && lanlord.toJSON().status !== MATCH_STATUS_FINISH) {
        members = members.toJSON().map((member) => pick(member, Member.limitFieldsList))
        tenant = tenant.toJSON({ isShort: true })
      } else {
        members = await Promise.all(
          members.toJSON().map(async (member) => {
            const incomes = await Promise.all(
              member.incomes.map(async (income) => {
                const proofs = await Promise.all(
                  income.proofs.map(async (proof) => {
                    if (!proof.file) return proof
                    proof.file = await FileBucket.getProtectedUrl(proof.file)
                    return proof
                  })
                )
                income = {
                  ...income,
                  proofs: proofs,
                }
                return income
              })
            )

            member = {
              ...member,
              rent_arrears_doc: await FileBucket.getProtectedUrl(member.rent_arrears_doc),
              debt_proof: await FileBucket.getProtectedUrl(member.debt_proof),
              incomes: incomes,
            }
            return member
          })
        )
      }

      const result = {
        ...lanlord.toJSON(),
        company: company,
        tenant: tenant,
        members: members,
      }
      response.res(result)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async getEstatesByPM({ request, auth, response }) {
    const { limit, page, ...params } = request.all()
    const landlordIds = await EstatePermissionService.getLandlordIds(
      auth.user.id,
      PROPERTY_MANAGE_ALLOWED
    )
    const result = await EstateService.getEstatesByUserId(landlordIds, limit, page, params)
    response.res(result)
  }
  /**
   *
   */
  async getEstates({ request, auth, response }) {
    let { limit, page, ...params } = request.all()
    if (!isEmpty(request.post())) {
      params = request.post()
    }
    // Update expired estates status to unpublished
    let result = await EstateService.getEstatesByUserId([auth.user.id], limit, page, params)
    result = result.toJSON()
    const filteredCounts = await EstateService.getFilteredCounts(auth.user.id, params)
    const totalEstateCounts = await EstateService.getTotalEstateCounts(auth.user.id)
    if (!EstateFilters.paramsAreUsed(params)) {
      //no param is used
      result = { ...result, ...totalEstateCounts }
    } else {
      //param is used
      if (params.letting_type) {
        //funnel filter was changed
        switch (params.letting_type[0]) {
          case LETTING_TYPE_LET:
            result = {
              ...result,
              all_count: totalEstateCounts.all_count,
              let_count: filteredCounts.let_count,
              void_count: totalEstateCounts.void_count,
            }
            break
          case LETTING_TYPE_VOID:
            result = {
              ...result,
              all_count: totalEstateCounts.all_count,
              let_count: totalEstateCounts.let_count,
              void_count: filteredCounts.void_count,
            }
            break
        }
      } else {
        //All is selected...
        result = {
          ...result,
          all_count: filteredCounts.all_count,
          let_count: totalEstateCounts.let_count,
          void_count: filteredCounts.void_count,
        }
      }
    }
    result = { ...result, total_estate_count: totalEstateCounts.all_count }
    return response.res(result)
  }

  /**
   * Get single estate with POI
   */
  async getEstate({ request, auth, response }) {
    const { id } = request.all()
    let estate = await EstateService.getQuery()
      .where('id', id)
      .where('user_id', auth.user.id)
      .whereNot('status', STATUS_DELETE)
      .with('point')
      .with('files')
      .with('current_tenant', function (q) {
        q.with('user')
      })
      .with('rooms', function (b) {
        b.whereNot('status', STATUS_DELETE)
          .with('images')
          .orderBy('order', 'asc')
          .orderBy('favorite', 'desc')
          .orderBy('id', 'asc')
          .with('room_amenities', function (q) {
            q.select(
              Database.raw(
                `amenities.*,
              case
                when
                  amenities.type='amenity'
                then
                  "options"."title"
                else
                  "amenities"."amenity"
              end as amenity`
              )
            )
              .from('amenities')
              .leftJoin('options', 'options.id', 'amenities.option_id')
              .where('amenities.location', 'room')
              .whereNot('amenities.status', STATUS_DELETE)
              .orderBy('amenities.sequence_order', 'desc')
          })
      })
      .first()

    if (!estate) {
      throw new HttpException('Invalid estate', 404)
    }
    estate = estate.toJSON({ isOwner: true })
    let amenities = await Amenity.query()
      .select(
        Database.raw(
          `amenities.location, json_agg(amenities.* order by sequence_order desc) as amenities`
        )
      )
      .from(
        Database.raw(`(
          select amenities.*,
            case
              when
                "amenities".type='amenity'
              then
                "options"."title"
              else
                "amenities"."amenity"
                  end as amenity
          from amenities
          left join options
          on options.id=amenities.option_id
          where
            amenities.status = '${STATUS_ACTIVE}'
          and
            amenities.location not in('room')
          and
            amenities.estate_id in ('${id}')
        ) as amenities`)
      )
      .where('status', STATUS_ACTIVE)
      .whereIn('estate_id', [id])
      .groupBy('location')
      .fetch()
    estate.amenities = amenities
    response.res(estate)
  }

  async getEstateByPM({ request, auth, response }) {
    const { id } = request.all()
    const landlordIds = await EstatePermissionService.getLandlordIds(
      auth.user.id,
      PROPERTY_MANAGE_ALLOWED
    )
    const estate = await EstateService.getQuery()
      .where('id', id)
      .whereIn('user_id', landlordIds)
      .whereNot('status', STATUS_DELETE)
      .with('point')
      .with('files')
      .with('rooms', function (b) {
        b.whereNot('status', STATUS_DELETE).with('images')
      })
      .first()

    if (!estate) {
      throw new HttpException('Invalid estate', 404)
    }

    response.res(estate.toJSON({ isOwner: true }))
  }

  /**
   *
   */
  async extendEstate({ request, auth, response }) {
    const { estate_id, avail_duration } = request.all()
    const available_date = moment().add(avail_duration, 'hours').toDate()
    const estate = await EstateService.getQuery()
      .where('id', estate_id)
      .where('user_id', auth.user.id)
      .whereNot('status', STATUS_DELETE)
      .update({ available_date: available_date, status: STATUS_ACTIVE })
    response.res(estate)
  }

  /**
   *
   */
  async deactivateEstate({ request, auth, response }) {
    const { estate_id } = request.all()
    const estate = await EstateService.getQuery()
      .where('id', estate_id)
      .where('user_id', auth.user.id)
      .whereNot('status', STATUS_DELETE)
      .update({ status: STATUS_DELETE })
    response.res(estate)
  }

  async importEstate({ request, auth, response }) {
    const { from_web } = request.all()
    const importFilePathName = request.file('file')

    if (importFilePathName && importFilePathName.tmpPath) {
      if (
        importFilePathName.headers['content-type'] !==
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        throw new HttpException('No excel format', 400)
      }
    } else {
      throw new HttpException('There is no excel data to import', 400)
    }
    const result = await ImportService.process(importFilePathName.tmpPath, auth.user.id, 'xls')
    return response.res(result)
  }

  //import Estate by property manager
  async importEstateByPM({ request, auth, response }) {
    const importFilePathName = request.file('file')

    if (importFilePathName && importFilePathName.tmpPath) {
      if (
        importFilePathName.headers['content-type'] !==
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        throw new HttpException('No excel format', 400)
      }
      const result = await ImportService.processByPM(
        importFilePathName.tmpPath,
        auth.user.id,
        'xls'
      )
      logEvent(request, LOG_TYPE_PROPERTIES_IMPORTED, auth.user.id, { imported: true }, false)
      Event.fire('mautic:syncContact', auth.user.id, { propertiesimported_count: 1 })
      return response.res(result)
    } else {
      throw new HttpException('There is no excel data to import', 400)
    }
  }

  /**
   *
   */
  async publishEstate({ request, auth, response }) {
    const { id, action } = request.all()
    const estate = await Estate.findOrFail(id)
    if (estate.user_id !== auth.user.id) {
      throw new HttpException('Not allow', 403)
    }
    if (!estate.avail_duration) {
      throw new HttpException('Estates is not completely filled', 400)
    }

    if (action === 'publish') {
      if (estate.status === STATUS_ACTIVE) {
        throw new HttpException('Cant update status', 400)
      }

      if ([STATUS_DRAFT, STATUS_EXPIRE].includes(estate.status)) {
        // Validate is Landlord fulfilled contacts
        try {
          await EstateService.publishEstate(estate, request)
        } catch (e) {
          if (e.name === 'ValidationException') {
            Logger.error(e)
            throw new HttpException('User not activated', 409)
          }
          throw e
        }
      } else {
        throw new HttpException('Invalid estate type', 400)
      }
    } else {
      await estate.updateItem({ status: STATUS_DRAFT }, true)
    }

    response.res(true)
  }

  async makeEstateOffline({ request, auth, response }) {
    const { id } = request.all()
    const trx = await Database.beginTransaction()
    try {
      const estate = await Estate.query().where('id', id).first()
      if (estate) {
        estate.status = STATUS_DRAFT
        await EstateService.handleOfflineEstate(estate.id, trx)
        await estate.save(trx)
        await trx.commit()
        return response.res(true)
      } else {
        throw new HttpException('You are attempted to edit wrong estate', 409)
      }
    } catch (e) {
      await trx.rollback()
      console.log({ e })
      throw new HttpException(e?.message ?? e, 400)
    }
  }

  /**
   *
   */
  async getEstatesQuickLinks({ request, auth, response }) {
    const { filter } = request.all()
    const currentDay = moment().startOf('day')
    const userId = auth.user.id
    const finalMatches = [MATCH_STATUS_FINISH]
    let estates = {}
    if (filter == 1) {
      estates = await Estate.query()
        .where({ user_id: userId })
        .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
        .where('to_date', '<', currentDay.format(DAY_FORMAT))
        .orderBy('id')
        .fetch()
    } else if (filter == 2) {
      estates = await Estate.query()
        .where({ user_id: userId })
        .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
        .with('slots')
        .whereHas('slots', (estateQuery) => {
          estateQuery.where('end_at', '<=', currentDay.format(DATE_FORMAT))
        })
        .orderBy('id')
        .fetch()
    } else if (filter == 3) {
      estates = await Estate.query()
        .where({ user_id: userId })
        .whereIn('status', [STATUS_ACTIVE])
        .with('matches')
        .whereHas('matches', (estateQuery) => {
          estateQuery.whereIn('status', [MATCH_STATUS_NEW]).where('buddy', true)
        })
        .orderBy('id')
        .fetch()
    } else if (filter == 4) {
      estates = await Estate.query()
        .where({ user_id: userId })
        .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
        .with('matches')
        .whereHas('matches', (estateQuery) => {
          estateQuery.whereIn('status', finalMatches)
        })
        .orderBy('id')
        .fetch()
    } else if (filter == 5) {
      estates = await Estate.query()
        .where({ user_id: userId })
        .whereIn('status', [STATUS_EXPIRE])
        // .whereNotNull('to_date' )
        // .where('to_date', '<', currentDay.format(DAY_FORMAT))
        .orderBy('id')
        .fetch()
    }

    response.res(estates)
  }
  /**
   *
   */
  async removeEstate({ request, auth, response }) {
    const { id } = request.all()
    await Estate.findByOrFail({ id, user_id: auth.user.id })
    await EstateService.removeEstate(id)

    response.res(true)
  }

  /**
   *
   */
  async addFile({ request, auth, response }) {
    const { estate_id, type } = request.all()

    let userIds = [auth.user.id]

    if (auth.user.role === ROLE_PROPERTY_MANAGER) {
      userIds = await EstatePermissionService.getLandlordIds(auth.user.id, PROPERTY_MANAGE_ALLOWED)
    }

    const estate = await Estate.query()
      .where('id', estate_id)
      .whereIn('user_id', userIds)
      .firstOrFail()

    const disk = 's3public'
    const file = request.file('file')
    const ext = file.extname
      ? file.extname
      : file.clientName.toLowerCase().replace(/.*(jpeg|jpg|png|doc|docx|pdf|xls|xlsx)$/, '$1')
    const filename = `${uuid.v4()}.${ext}`
    const filePathName = `${moment().format('YYYYMM')}/${filename}`
    await Drive.disk(disk).put(filePathName, Drive.getStream(file.tmpPath), {
      ACL: 'public-read',
      ContentType: file.headers['content-type'],
    })
    const fileObj = await EstateService.addFile({ disk, url: filePathName, type, estate })
    Event.fire('estate::update', estate_id)

    response.res(fileObj)
  }

  /**
   *
   */
  async removeFile({ request, auth, response }) {
    const { estate_id, id } = request.all()
    const file = await File.query()
      .select('files.*')
      .where('files.id', id)
      .innerJoin('estates', 'estates.id', 'files.estate_id')
      .where('estates.id', estate_id)
      .where('estates.user_id', auth.user.id)
      .first()
    if (!file) {
      throw new HttpException('Image not found', 404)
    }

    await EstateService.removeFile(file)
    response.res(true)
  }

  /**
   *
   */
  async getTenantEstates({ request, auth, response }) {
    const { exclude_from, exclude_to, exclude, limit = 20 } = request.all()

    const user = auth.user
    let estates
    try {
      estates = await EstateService.getTenantAllEstates(
        user.id,
        { exclude_from, exclude_to, exclude },
        limit
      )
    } catch (e) {
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 406)
      }
      throw e
    }

    response.res(estates.toJSON({ isShort: true, role: user.role }))
  }

  /**
   *
   */
  async getTenantEstate({ request, auth, response }) {
    const { id } = request.all()

    const estate = await EstateService.getQuery()
      .with('point')
      .with('files')
      .with('rooms', function (b) {
        b.where('status', STATUS_ACTIVE).with('images')
      })
      .where('id', id)
      .first()

    if (!estate) {
      throw new HttpException('Invalid estate', 404)
    }

    if( !estate.full_address && estate.coord_raw ) {
      const coords = estate.coord_raw.split(',')
      const lat = coords[0]
      const lon = coords[1]
      const isolinePoints = await GeoService.getOrCreateIsoline({lat,lon}, TRANSPORT_TYPE_WALK, 60)
      estate.isoline = isolinePoints?.toJSON()?.data || []
    }

    response.res(estate.toJSON({ isShort: true, role: auth.user.role }))
  }

  /**
   *
   */
  async acceptEstateInvite({ request, auth, response }) {
    const { code } = request.all()
    const estate = await EstateService.getEstateByHash(code)
    if (!estate) {
      throw new HttpException('Estate not exists', 404)
    }

    try {
      await MatchService.addBuddy(estate, auth.user.id)
    } catch (e) {
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400, ERROR_BUDDY_EXISTS)
      }
      throw e
    }

    response.res(estate)
  }

  /**
   *
   */
  async getSlots({ request, auth, response }) {
    const { estate_id } = request.all()
    const estate = await EstateService.getActiveEstateQuery()
      .where('user_id', auth.user.id)
      .where('id', estate_id)
      .first()
    if (!estate) {
      throw new HttpException('Estate not exists', 404)
    }

    const slots = await EstateService.getTimeSlotsByEstate(estate)
    response.res(slots.rows)
  }

  /**
   *
   */
  async createSlot({ request, auth, response }) {
    const { estate_id, ...data } = request.all()
    const estate = await EstateService.getActiveEstateQuery()
      .where('user_id', auth.user.id)
      .where('id', estate_id)
      .first()
    if (!estate) {
      throw HttpException('Estate not exists', 404)
    }

    try {
      const slot = await EstateService.createSlot(data, estate)

      return response.res(slot)
    } catch (e) {
      Logger.error(e)
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async updateSlot({ request, auth, response }) {
    const { estate_id, slot_id, ...rest } = request.all()
    const slot = await EstateService.getTimeSlotByOwner(auth.user.id, slot_id)
    if (!slot) {
      throw new HttpException('Time slot not found', 404)
    }

    try {
      const updatedSlot = await EstateService.updateSlot(slot, rest)
      return response.res(updatedSlot)
    } catch (e) {
      Logger.error(e)
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async removeSlot({ request, auth, response }) {
    const { slot_id } = request.all()
    const slot = await EstateService.getTimeSlotByOwner(auth.user.id, slot_id)
    if (!slot) {
      throw new HttpException('Time slot not found', 404)
    }
    await slot.delete()

    response.res(true)
  }

  /**
   *
   */
  async likeEstate({ request, auth, response }) {
    const { id } = request.all()
    try {
      await EstateService.addLike(auth.user.id, id)
    } catch (e) {
      throw new HttpException(e.message)
    }

    response.res(true)
  }

  /**
   *
   */
  async unlikeEstate({ request, auth, response }) {
    const { id } = request.all()
    await EstateService.removeLike(auth.user.id, id)
    response.res(true)
  }

  /**
   *
   */
  async dislikeEstate({ request, auth, response }) {
    const { id } = request.all()
    try {
      await EstateService.addDislike(auth.user.id, id)
    } catch (e) {
      throw new HttpException(e.message)
    }

    response.res(true)
  }

  /**
   *
   */
  async removeEstateDislike({ request, auth, response }) {
    const { id } = request.all()
    await EstateService.removeDislike(auth.user.id, id)
    response.res(true)
  }

  /**
   *
   */
  async getEstateFreeTimeslots({ request, auth, response }) {
    const { estate_id } = request.all()
    const slots = await EstateService.getFreeTimeslots(estate_id)

    return response.res(slots)
  }

  /**
   *
   */
  async verifyPropertyId({ request, auth, response }) {
    const { property_id, estate_id } = request.all()
    const estate = await Estate.query()
      .select(Database.raw('count(*) as row_count'))
      .where({ property_id })
      .where('user_id', auth.user.id)
      .whereNotIn('status', [STATUS_DELETE])
      .whereNot({ id: estate_id || null })
      .first()

    response.res(!(estate.row_count > 0))
  }

  async getInviteToViewCode({ request, auth, response }) {}

  async createInviteToViewCode({ request, auth, response }) {
    req.res(request.all())
  }

  async inviteToViewViaEmail({ request, auth, response }) {
    const estateId = request.params.estate_id || request.body.estate_id
    const emails = request.body.emails

    //Transaction start...
    const trx = await Database.beginTransaction()
    let code
    //check if this estate already has an invite
    const invitation = await EstateViewInvite.query().where('estate_id', estateId).first()
    if (invitation) {
      code = invitation.code
    } else {
      do {
        //generate code
        code = randomstring.generate(INVITE_CODE_STRING_LENGTH)
      } while (await EstateViewInvite.findBy('code', code))
    }

    try {
      let newInvite = new EstateViewInvite()
      if (!invitation) {
        //this needs to be created
        newInvite.invited_by = auth.user.id
        newInvite.estate_id = estateId
        newInvite.code = code
        const result = await newInvite.save(trx)
      } else {
        newInvite = invitation
      }

      await Promise.all(
        emails.map(async (email) => {
          // see if this prospect is already a user
          const userExists = await User.query()
            .where('email', email)
            .where('role', ROLE_USER)
            .first(trx)
          if (userExists) {
            //we invite the user
            await EstateViewInvitedUser.findOrCreate(
              { user_id: userExists.id, estate_view_invite_id: newInvite.id },
              { user_id: userExists.id, estate_view_invite_id: newInvite.id },
              trx
            )
          } else {
            //we add email
            await EstateViewInvitedEmail.findOrCreate(
              { email, estate_view_invite_id: newInvite.id },
              { email, estate_view_invite_id: newInvite.id },
              trx
            )
          }
          //placeholder for now...
        })
      )
      await trx.commit()
      //transaction end
      return response.res({ code })
    } catch (e) {
      console.log(e)
      await trx.rollback()
      //transaction failed
      throw new HttpException('Failed to invite buddies to view estate.', 412)
    }
  }

  async export({ request, auth, response }) {
    const { lang } = request.params

    let result = await EstateService.getEstatesByUserId([auth.user.id], 0, 0, { return_all: 1 })
    let rows = []

    if (lang) {
      const AttributeTranslations = new EstateAttributeTranslations(lang)
      const reverseMap = AttributeTranslations.getReverseDataMap()
      await Promise.all(
        result.toJSON().map(async (row) => {
          for (let attribute in row) {
            if (reverseMap[attribute]) {
              if (isFunction(reverseMap[attribute])) {
                row[attribute] = reverseMap[attribute](row[attribute])
              } else if (reverseMap[attribute][row[attribute]]) {
                //key value pairs
                row[attribute] =
                  reverseMap[attribute][
                    isNumber(row[attribute]) ? parseInt(row[attribute]) : row[attribute]
                  ]
              }
            }
          }
          const letting_type = reverseMap['let_type'][row.letting_type]
          const letting_status = reverseMap['let_status'][row.letting_status]

          if (reverseMap['let_status'][row.letting_status]) {
            row.parsed_letting_status = `${letting_type} - ${letting_status}`
          } else {
            row.parsed_letting_status = `${letting_type}`
          }
          row.breeze_id = row.six_char_code
          let rooms_parsed = {}
          await row.rooms.map((room) => {
            if (room.import_sequence) {
              rooms_parsed[`room_${room.import_sequence}`] = l.get(`${room.name}.message`, lang)
            }
          })
          row.rooms_parsed = rooms_parsed
          row.deposit_multiplier = Number(row.deposit) / Number(row.net_rent)
          row.letting_status_merged = row.letting_status
            ? `${row.letting_type}.${row.letting_status}`
            : `${row.letting_type}`
          rows.push(row)
          return row
        })
      )
    } else {
      rows = result.toJSON()
      await Promise.all(
        rows.map(async (row, index) => {
          let rooms_parsed = {}
          await row.rooms.map((room) => {
            if (room.import_sequence) {
              rooms_parsed[`room_${room.import_sequence}`] = room.type
            }
          })
          rows[index].rooms_parsed = rooms_parsed
          rows[index].deposit_multiplier = Number(row.deposit) / Number(row.net_rent)
          rows[index].letting_status_merged = row.letting_status
            ? `${row.letting_type}.${row.letting_status}`
            : `${row.letting_type}`
        })
      )
    }
    return response.res(rows)
  }

  async deleteMultiple({ auth, request, response }) {
    const { id } = request.all()
    const trx = await Database.beginTransaction()
    let affectedRows
    try {
      affectedRows = await EstateService.deleteEstates(id, auth.user.id, trx)
    } catch (error) {
      await trx.rollback()
      throw new HttpException(error.message, 422, 1101230)
    }
    await trx.commit()
    return response.res({ deleted: affectedRows })
  }
}

module.exports = EstateController
