'use strict'

const moment = require('moment')

const Admin = use('App/Models/Admin')
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
const User = use('App/Models/User')
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
  DAY_FORMAT,
  MATCH_STATUS_NEW,
  PROPERTY_MANAGE_ALLOWED,
  ROLE_PROPERTY_MANAGER,
  MATCH_STATUS_FINISH,
  LOG_TYPE_PROPERTIES_IMPORTED,
  ROLE_USER,
  LETTING_TYPE_LET,
  LETTING_TYPE_VOID,
  LETTING_TYPE_NA,
  USER_ACTIVATION_STATUS_DEACTIVATED,
  USER_ACTIVATION_STATUS_ACTIVATED,
  MATCH_STATUS_KNOCK,
  MATCH_STATUS_INVITE,
  MATCH_STATUS_VISIT,
  MATCH_STATUS_SHARE,
  MATCH_STATUS_COMMIT,
  MATCH_STATUS_TOP,
  IMPORT_TYPE_EXCEL,
  IMPORT_ENTITY_ESTATES,
  IMPORT_ACTIVITY_PENDING,
  FILE_LIMIT_LENGTH,
  FILE_TYPE_UNASSIGNED,
  FILE_TYPE_EXTERNAL,
  FILE_TYPE_CUSTOM,
  FILE_TYPE_PLAN,
  LOG_TYPE_PUBLISHED_PROPERTY,
  ROLE_LANDLORD,
} = require('../../constants')
const { logEvent } = require('../../Services/TrackingService')
const { isEmpty, isFunction, isNumber, pick, trim, sum } = require('lodash')
const EstateAttributeTranslations = require('../../Classes/EstateAttributeTranslations')
const EstateFilters = require('../../Classes/EstateFilters')
const MailService = require('../../Services/MailService')
const UserService = require('../../Services/UserService')
const EstateCurrentTenantService = require('../../Services/EstateCurrentTenantService')
const TimeSlotService = require('../../Services/TimeSlotService')
const QueueService = require('../../Services/QueueService')

const INVITE_CODE_STRING_LENGTH = 8

const {
  exceptions: {
    ESTATE_NOT_EXISTS,
    SOME_IMAGE_NOT_EXIST,
    WRONG_PARAMS,
    IMAGE_COUNT_LIMIT,
    FAILED_IMPORT_FILE_UPLOAD,
    FAILED_TO_ADD_FILE,
    CURRENT_IMAGE_COUNT,
    FAILED_EXTEND_ESTATE,
  },
} = require('../../../app/exceptions')

class EstateController {
  async createEstateByPM({ request, auth, response }) {
    const data = request.all()
    const landlordIds = await EstatePermissionService.getLandlordIds(
      auth.user.id,
      PROPERTY_MANAGE_ALLOWED
    )

    if (landlordIds.includes(data.landlord_id)) {
      const estate = await EstateService.createEstate({ request, userId: data.landlord_id })
      response.res(estate)
    } else {
      throw new HttpException('Not Allowed', 400)
    }
  }

  /**
   *
   */
  async createEstate({ request, auth, response }) {
    try {
      const user = await UserService.getById(auth.user.id)

      if (user.activation_status === USER_ACTIVATION_STATUS_DEACTIVATED) {
        throw new HttpException('No permission to create estate')
      }

      const estate = await EstateService.createEstate({ request, userId: auth.user.id })

      if (user.activation_status !== USER_ACTIVATION_STATUS_ACTIVATED) {
        const { street, house_number, zip, city, country } = request.all()
        const address = trim(
          `${street || ''}, ${house_number || ''}, ${zip || ''}, ${city || ''}, ${
            country || 'Germany'
          }`
        ).toLowerCase()

        const txt = `The landlord '${
          user.email
        }' created a property with an address '${address}' in ${
          process.env.NODE_ENV || 'local'
        } environment`

        MailService.sendUnverifiedLandlordActivationEmailToAdmin(txt)
      }

      response.res(estate)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
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

      const newEstate = await EstateService.updateEstate(request, auth.user.id)
      response.res(newEstate)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }
  /**
   *
   */
  async updateEstate({ request, auth, response }) {
    const { id } = request.all()
    const estate = await Estate.findOrFail(id)
    if (estate.user_id !== auth.user.id) {
      throw new HttpException('Not allow', 403)
    }

    const newEstate = await EstateService.updateEstate(request, auth.user.id)
    response.res(newEstate)
  }

  async landlordTenantDetailInfo({ request, auth, response }) {
    const { estate_id, tenant_id } = request.all()
    try {
      const landlord = await EstateService.landlordTenantDetailInfo(
        auth.user.id,
        estate_id,
        tenant_id
      )
      let tenant = await TenantService.getTenant(tenant_id)
      let members = await MemberService.getMembers(tenant_id, true)
      const company = await CompanyService.getUserCompany(auth.user.id)

      if (!landlord.toJSON().share && landlord.toJSON().status !== MATCH_STATUS_FINISH) {
        members = (members || members.toJSON() || []).map((member) =>
          pick(member, Member.limitFieldsList)
        )
        tenant = tenant.toJSON({ isShort: true })
      }

      const result = {
        ...landlord.toJSON(),
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
    const result = await EstateService.getEstatesByUserId({
      ids: landlordIds,
      limit,
      page,
      params,
    })
    result.data = await EstateService.checkCanChangeLettingStatus(result, { isOwner: true })
    delete result.rows
    response.res(result)
  }

  async searchEstates({ request, auth, response }) {
    const { query, coord } = request.all()
    if (!coord && !query) {
      throw new HttpException(WRONG_PARAMS, 400)
    }
    const estates = await EstateService.getEstatesByQuery({ user_id: auth.user.id, query, coord })
    response.res(estates)
  }

  async shortSearchEstates({ request, auth, response }) {
    const { query, letting_type } = request.all()
    response.res(
      await EstateService.getShortEstatesByQuery({ user_id: auth.user.id, query, letting_type })
    )
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
    let result = await EstateService.getEstatesByUserId({
      ids: [auth.user.id],
      limit,
      page,
      params,
    })

    result.data = await EstateService.checkCanChangeLettingStatus(result, { isOwner: true })
    result.data = (result.data || []).map((estate) => {
      const outside_view_has_media =
        (estate.files || []).filter((f) => f.type == FILE_TYPE_EXTERNAL).length || 0
      const inside_view_has_media = sum(
        (estate?.rooms || []).map((room) => room?.images?.length || 0)
      )
      const document_view_has_media =
        ((estate.files || []).filter(
          (f) => f.type === FILE_TYPE_CUSTOM || f.type === FILE_TYPE_PLAN
        ).length || 0) + (estate.energy_proof && trim(estate.energy_proof) !== '' ? 1 : 0)
      const unassigned_view_has_media =
        (estate.files || []).filter((f) => f.type == FILE_TYPE_UNASSIGNED).length || 0

      return {
        ...estate,
        inside_view_has_media,
        outside_view_has_media,
        document_view_has_media,
        unassigned_view_has_media,
      }
    })
    delete result?.rows

    const filteredCounts = await EstateService.getFilteredCounts(auth.user.id, params)
    const totalEstateCounts = await EstateService.getTotalEstateCounts(auth.user.id)
    if (!EstateFilters.paramsAreUsed(params)) {
      //no param is used
      result = { ...result, ...totalEstateCounts }
    } else {
      //param is used
      if (params.letting_type) {
        //funnel filter was changed
        result = {
          ...result,
          all_count: totalEstateCounts.all_count,
          let_count:
            params.letting_type[0] === LETTING_TYPE_LET
              ? filteredCounts.let_count
              : totalEstateCounts.let_count,
          void_count:
            params.letting_type[0] === LETTING_TYPE_VOID
              ? filteredCounts.void_count
              : totalEstateCounts.void_count,
          na_count:
            params.letting_type[0] === LETTING_TYPE_NA
              ? filteredCounts.na_count
              : totalEstateCounts.na_count,
        }
      } else {
        //All is selected...
        result = {
          ...result,
          all_count: filteredCounts.all_count,
          let_count: totalEstateCounts.let_count,
          void_count: totalEstateCounts.void_count,
          na_count: totalEstateCounts.na_count,
        }
      }
    }
    result = {
      ...result,
      total_estate_count: totalEstateCounts.all_count,
      offline_count: totalEstateCounts.offline_count,
      online_count: totalEstateCounts.online_count,
    }
    return response.res(result)
  }

  /**
   * Get single estate with POI
   */
  async getEstate({ request, auth, response }) {
    const { id } = request.all()
    const user_id = auth.user instanceof Admin ? null : auth.user.id
    let estate = await EstateService.getEstateWithDetails({ id, user_id, role: auth.user.role })
    if (!estate) {
      throw new HttpException('Invalid estate', 404)
    }
    estate = estate.toJSON({ isOwner: true })
    const outside_view_has_media =
      (estate.files || []).filter((f) => f.type == FILE_TYPE_EXTERNAL).length || 0
    const inside_view_has_media = sum(
      (estate?.rooms || []).map((room) => room?.images?.length || 0)
    )
    const document_view_has_media =
      ((estate.files || []).filter((f) => f.type === FILE_TYPE_CUSTOM || f.type === FILE_TYPE_PLAN)
        .length || 0) + (estate.energy_proof && trim(estate.energy_proof) !== '' ? 1 : 0)
    const unassigned_view_has_media = (estate.files || []).filter(
      (f) => f.type == FILE_TYPE_UNASSIGNED
    ).length

    estate = await EstateService.assignEstateAmenities(estate)
    estate = {
      ...estate,
      inside_view_has_media,
      outside_view_has_media,
      document_view_has_media,
      unassigned_view_has_media,
    }
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
    const { estate_id, available_end_at } = request.all()
    try {
      await EstateService.extendEstate({ user_id: auth.user.id, estate_id, available_end_at })
      response.res(
        await EstateService.getEstateWithDetails({
          id: estate_id,
          user_id: auth.user.id,
          role: ROLE_LANDLORD,
        })
      )
    } catch (e) {
      throw new HttpException(FAILED_EXTEND_ESTATE, 400)
    }
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
    const importFilePathName = request.file('file')

    if (importFilePathName && importFilePathName.tmpPath) {
      if (
        importFilePathName.headers['content-type'] !==
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        throw new HttpException('Not an excel format', 400)
      }
    } else {
      throw new HttpException('Error found while uploading file.', 400)
    }

    const imageMimes = [FileBucket.MIME_EXCEL, FileBucket.MIME_EXCELX]
    const files = await FileBucket.saveRequestFiles(request, [
      { field: 'file', mime: imageMimes, isPublic: false },
    ])

    if (files?.file) {
      const importItem = await ImportService.addImportFile({
        user_id: auth.user.id,
        filename: importFilePathName?.clientName || null,
        type: IMPORT_TYPE_EXCEL,
        entity: IMPORT_ENTITY_ESTATES,
        status: IMPORT_ACTIVITY_PENDING,
      })

      QueueService.importEstate({
        s3_bucket_file_name: files?.file,
        fileName: importFilePathName,
        user_id: auth.user.id,
        template: 'xls',
        import_id: importItem.id,
      })
      response.res(importItem)
    } else {
      throw new HttpException(FAILED_IMPORT_FILE_UPLOAD, 500)
    }
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
    let status = estate.status
    if (estate.user_id !== auth.user.id) {
      throw new HttpException('Not allow', 403)
    }
    if (
      !estate.available_start_at ||
      (!estate.is_duration_later && !estate.available_end_at) ||
      (estate.is_duration_later && !estate.min_invite_count)
    ) {
      throw new HttpException('Estates is not completely filled', 400)
    }

    if (action === 'publish') {
      // if (estate.status === STATUS_ACTIVE) {
      //   throw new HttpException('Cant update status', 400)
      // }

      if (
        [STATUS_DRAFT, STATUS_EXPIRE].includes(estate.status) &&
        estate.letting_type !== LETTING_TYPE_LET
      ) {
        // Validate is Landlord fulfilled contacts
        try {
          status = await EstateService.publishEstate(estate)
        } catch (e) {
          if (e.name === 'ValidationException') {
            Logger.error(e)
            throw new HttpException('User not activated', 409)
          }
          throw new HttpException(e.message, e.status || 400)
        }
      } else {
        throw new HttpException('Invalid estate type', 400)
      }
      logEvent(
        request,
        LOG_TYPE_PUBLISHED_PROPERTY,
        estate.user_id,
        { estate_id: estate.id },
        false
      )
    } else {
      await estate.updateItem({ status: STATUS_DRAFT }, true)
      status = STATUS_DRAFT
    }

    response.res({
      status,
    })
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
        response.res(true)
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
        .select('time_slots.*', 'estates.*')
        .select(Database.raw('COUNT(visits)::int as visitCount'))
        .where('estates.user_id', userId)
        .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])
        .leftJoin('time_slots', function () {
          this.on('estates.id', 'time_slots.estate_id')
        })
        .where('time_slots.end_at', '<=', currentDay.format(DAY_FORMAT))
        .leftJoin('visits', function () {
          this.on('visits.start_date', '>=', 'time_slots.start_at')
            .on('visits.end_date', '<=', 'time_slots.end_at')
            .on('visits.estate_id', '=', 'estates.id')
        })
        .groupBy('time_slots.id', 'estates.id')
        .orderBy('time_slots.end_at', 'DESC')
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
        // We make final matched estates statuses "DRAFT"
        .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE, STATUS_DRAFT])
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
    await EstateService.removeEstate(id, auth.user.id)

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
      .with('files', function (f) {
        f.where('type', type)
      })
      .whereIn('user_id', userIds)
      .firstOrFail()

    const count = FileBucket.filesCount(request, 'file')
    const image_length = estate.toJSON().files?.length || 0
    if (
      type !== FILE_TYPE_UNASSIGNED &&
      estate.toJSON().files &&
      image_length + count > FILE_LIMIT_LENGTH
    ) {
      throw new HttpException(`${IMAGE_COUNT_LIMIT} ${CURRENT_IMAGE_COUNT}:${image_length}`, 400)
    }

    const imageMimes = [
      FileBucket.IMAGE_JPEG,
      FileBucket.IMAGE_PNG,
      FileBucket.IMAGE_TIFF,
      FileBucket.IMAGE_WEBP,
      FileBucket.IMAGE_HEIC,
      FileBucket.IMAGE_GIF,
      FileBucket.IMAGE_PDF,
      FileBucket.MIME_DOC,
      FileBucket.MIME_DOCX,
      FileBucket.MIME_EXCEL,
      FileBucket.MIME_EXCELX,
    ]
    const files = await FileBucket.saveRequestFiles(request, [
      { field: 'file', mime: imageMimes, isPublic: true },
    ])

    if (files && files.file) {
      const paths = Array.isArray(files.file) ? files.file : [files.file]
      const original_file_names = Array.isArray(files.original_file)
        ? files.original_file
        : [files.original_file]
      const formats = Array.isArray(files.format) ? files.format : [files.format]

      const data = paths.map((path, index) => {
        return {
          disk: 's3public',
          url: path,
          file_name: original_file_names[index],
          type,
          estate_id: estate.id,
          file_format: formats[index],
        }
      })
      const trx = await Database.beginTransaction()
      try {
        const result = await EstateService.addManyFiles(data, trx)

        await EstateService.updatePercent(
          { estate_id: data[0].estate_id, files: [result[0].toJSON()] },
          trx
        )
        await EstateService.updateCover({ estate_id: estate.id, addImage: result[0] }, trx)
        await trx.commit()
        Event.fire('estate::update', estate_id)
        return response.res(result)
      } catch (e) {
        await trx.rollback()
        console.log('Exception happened', e.message)
        throw new HttpException(FAILED_TO_ADD_FILE, 500)
      }
    }
    throw new HttpException(FAILED_TO_ADD_FILE, 500)
  }

  /**
   *
   */
  async removeFile({ request, auth, response }) {
    const { estate_id, id } = request.all()
    try {
      await EstateService.removeFile({ ids: [id], estate_id, user_id: auth.user.id })
      response.res(true)
    } catch (e) {
      throw new HttpException(e.message, e.status || 400)
    }
  }

  async removeMultipleFiles({ request, auth, response }) {
    const { estate_id, ids } = request.all()
    const trx = await Database.beginTransaction()
    try {
      await EstateService.removeFile({ ids, estate_id, user_id: auth.user.id }, trx)
      await trx.commit()
      response.res(true)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400)
    }

    response.res(true)
  }

  async updateOrder({ request, auth, response }) {
    const { estate_id, ids, type } = request.all()

    const trx = await Database.beginTransaction()
    try {
      await EstateService.hasPermission({
        id: estate_id,
        user_id: auth.user.id,
      })

      const imageIds = await EstateService.getFiles({ estate_id, ids, type })
      if (imageIds.length != ids.length) {
        throw new HttpException(SOME_IMAGE_NOT_EXIST)
      }

      await Promise.all(
        ids.map(async (id, index) => {
          await File.query()
            .where('id', id)
            .update({ order: index + 1 })
            .transacting(trx)
        })
      )
      await trx.commit()
      response.res(true)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400)
    }
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

      estates = await Promise.all(
        estates.toJSON({ isShort: true, role: user.role }).map(async (estate) => {
          estate.isoline = await EstateService.getIsolines(estate)
          return estate
        })
      )
    } catch (e) {
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 406)
      }
      throw e
    }

    response.res(estates)
  }

  /**
   *
   */
  async getTenantEstate({ request, auth, response }) {
    const { id } = request.all()

    let estate = await EstateService.getEstateWithDetails({
      id,
      user_id: auth.user.id,
      role: auth.user.role,
    })

    if (!estate) {
      throw new HttpException('Invalid estate', 404)
    }

    estate.isoline = await EstateService.getIsolines(estate)

    estate = estate.toJSON({
      isShort: true,
      role: auth.user.role,
      extraFields: ['landlord_type', 'hash'],
    })
    estate = await EstateService.assignEstateAmenities(estate)
    response.res(estate)
  }

  /**
   *
   */
  async acceptEstateInvite({ request, auth, response }) {
    const { code } = request.all()
    const estate = await EstateService.getEstateByHash(code)
    if (!estate) {
      throw new HttpException(ESTATE_NOT_EXISTS, 404)
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
    const estateQuery = EstateService.getActiveEstateQuery().where('id', estate_id)

    if (!(auth.user instanceof Admin)) {
      estateQuery.where('user_id', auth.user.id)
    }

    const estate = await estateQuery.first()

    if (!estate) {
      throw new HttpException(ESTATE_NOT_EXISTS, 404)
    }

    const slots = await TimeSlotService.getTimeSlotsByEstate(estate)
    response.res(slots?.rows || [])
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
      throw new HttpException(ESTATE_NOT_EXISTS, 400)
    }

    try {
      const slot = await TimeSlotService.createSlot(data, estate)
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
    const data = request.all()
    try {
      response.res(await TimeSlotService.updateTimeSlot(auth.user.id, data))
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
    try {
      response.res(await TimeSlotService.removeSlot(auth.user.id, slot_id))
    } catch (e) {
      Logger.error(e)
      throw new HttpException(e.message, 400)
    }
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
  async getEstateFreeTimeslots({ request, response }) {
    const { estate_id } = request.all()
    const slots = await TimeSlotService.getFreeTimeslots(estate_id)

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

    try {
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
      response.res({ code })
    } catch (e) {
      await trx.rollback()
      console.log(e)
      //transaction failed
      throw new HttpException('Failed to invite buddies to view estate.', 412)
    }
  }

  async export({ request, auth, response }) {
    const { lang } = request.params
    let result = await EstateService.getEstatesByUserId({
      ids: [auth.user.id],
    })
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
          row.deposit_multiplier = Math.round(Number(row.deposit) / Number(row.net_rent))
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
          rows[index].deposit_multiplier = Math.round(Number(row.deposit) / Number(row.net_rent))
          rows[index].letting_status_merged = row.letting_status
            ? `${row.letting_type}.${row.letting_status}`
            : `${row.letting_type}`
        })
      )
    }
    return response.res(rows)
  }

  async importLastActivity({ auth, request, response }) {
    let last_import_activities = await ImportService.getLastImportActivities(auth.user.id)
    return response.res(last_import_activities)
  }

  async postImportLastActivity({ auth, request, response }) {
    const { filename, action, type, entity } = request.all()
    const result = await ImportService.postLastActivity({
      user_id: auth.user.id,
      filename,
      action,
      type,
      entity,
    })
    return response.res(result)
  }

  async deleteMultiple({ auth, request, response }) {
    const { id } = request.all()
    const trx = await Database.beginTransaction()
    try {
      const affectedRows = await EstateService.deleteEstates(id, auth.user.id, trx)
      await trx.commit()
      response.res({ deleted: affectedRows })
    } catch (error) {
      await trx.rollback()
      throw new HttpException(error.message, 422, 1101230)
    }
  }

  async getLatestEstates({ request, auth, response }) {
    const { limit } = request.all()
    const estates = await EstateService.getLatestEstates(limit)
    const prospectCount = await UserService.getCountOfProspects()

    response.res({
      estates,
      prospectCount,
    })
  }

  async changeLettingType({ request, auth, response }) {
    const { id, letting_type } = request.all()
    const matchCount = await MatchService.matchCount(
      [
        MATCH_STATUS_KNOCK,
        MATCH_STATUS_INVITE,
        MATCH_STATUS_VISIT,
        MATCH_STATUS_SHARE,
        MATCH_STATUS_COMMIT,
        MATCH_STATUS_TOP,
        MATCH_STATUS_FINISH,
      ],
      [id]
    )

    if (matchCount && matchCount.length && parseInt(matchCount[0].count)) {
      throw new HttpException(
        "There is a match for that property, You can't change type of let, Please contact to customer service to change it",
        400
      )
    }

    const estateCurrentTenant = await EstateCurrentTenantService.getCurrentTenantByEstateId({
      estate_id: id,
    })

    if (estateCurrentTenant) {
      throw new HttpException(
        "There is a tenant for that property, You can't change type of let, Please contact to customer service to change it",
        400
      )
    }

    await Estate.query()
      .where('id', id)
      .where('user_id', auth.user.id)
      .whereNot('status', STATUS_DELETE)
      .update({ letting_type: letting_type })

    response.res(true)
  }

  async importOpenimmo({ request, response, auth }) {
    try {
      await EstateService.importOpenimmo(request.importFile, auth.user.id)
      response.res(true)
    } catch (err) {
      throw new HttpException(err.message, 412)
    }
  }

  async getFiles({ response, params }) {
    const { estate_id } = params
    try {
      response.res(await EstateService.getFilesByEstateId(estate_id))
    } catch (err) {
      throw new HttpException(err.message)
    }
  }
}

module.exports = EstateController
