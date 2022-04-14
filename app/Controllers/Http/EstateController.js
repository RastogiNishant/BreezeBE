'use strict'

const uuid = require('uuid')
const moment = require('moment')

const Event = use('Event')
const Logger = use('Logger')
const Estate = use('App/Models/Estate')
const File = use('App/Models/File')
const EstateService = use('App/Services/EstateService')
const MatchService = use('App/Services/MatchService')
const QueueService = use('App/Services/QueueService')
const ImportService = use('App/Services/ImportService')
const TenantService = use('App/Services/TenantService')
const MemberService = use('App/Services/MemberService')
const CompanyService = use('App/Services/CompanyService')
const EstatePermissionService = use('App/Services/EstatePermissionService')
const HttpException = use('App/Exceptions/HttpException')
const Drive = use('Drive')
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
  DATE_FORMAT,
  DAY_FORMAT,
  MATCH_STATUS_NEW,
  PROPERTY_MANAGE_ALLOWED,
  ROLE_PROPERTY_MANAGER,
  MATCH_STATUS_FINISH,
  LOG_TYPE_PROPERTIES_IMPORTED,
  ROLE_USER,
} = require('../../constants')
const { logEvent } = require('../../Services/TrackingService')
const { isEmpty, isFunction, isNumber } = require('lodash')
const EstateAttributeTranslations = require('../../Classes/EstateAttributeTranslations')
const INVITE_CODE_STRING_LENGTH = 8

class EstateController {
  async createEstateByPM({ request, auth, response }) {
    const data = request.all()
    const landlordIds = await EstatePermissionService.getLandlordIds(
      auth.user.id,
      PROPERTY_MANAGE_ALLOWED
    )

    if (landlordIds.includes(data.landlord_id)) {
      const estate = await EstateService.createEstate(data, data.landlord_id)
      // Run processing estate geo nearest
      QueueService.getEstatePoint(estate.id)
      response.res(estate)
    } else {
      throw new HttpException('Not Allowed', 400)
    }
  }

  /**
   *
   */
  async createEstate({ request, auth, response }) {
    const data = request.all()

    const estate = await EstateService.createEstate(data, auth.user.id)
    // Run processing estate geo nearest
    QueueService.getEstatePoint(estate.id)
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

      await estate.updateItem(data)
      Event.fire('estate::update', estate.id)

      // Run processing estate geo nearest
      QueueService.getEstatePoint(estate.id)

      response.res(estate)
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

    await estate.updateItem(data)
    Event.fire('estate::update', estate.id)

    // Run processing estate geo nearest
    QueueService.getEstatePoint(estate.id)

    response.res(estate)
  }

  async lanlordTenantDetailInfo({ request, auth, response }) {
    const { estate_id, tenant_id } = request.all()
    try {
      const lanlord = await EstateService.lanlordTenantDetailInfo(
        auth.user.id,
        estate_id,
        tenant_id
      )
      const tenant = await TenantService.getTenant(tenant_id)
      const members = await MemberService.getMembers(tenant_id)
      const company = await CompanyService.getUserCompany(auth.user.id)

      const result = {
        ...lanlord.toJSON(),
        company: company,
        tenant: tenant,
        members: members,
      }
      //console.log('result', result.toJSON() )
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
    const { limit, page, ...params } = request.all()
    const userIds = [auth.user.id]
    // Update expired estates status to unpublished
    const result = await EstateService.getEstatesByUserId([auth.user.id], limit, page, params)
    response.res(result)
  }

  /**
   * Get single estate with POI
   */
  async getEstate({ request, auth, response }) {
    const { id } = request.all()
    const estate = await EstateService.getQuery()
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
      })
      .first()

    if (!estate) {
      throw new HttpException('Invalid estate', 404)
    }

    response.res(estate.toJSON({ isOwner: true }))
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
        console.log('>>> here')
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
        .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
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
      .where({ property_id })
      .whereNot({ id: estate_id || null })
      .orderBy('id')
      .fetch()
    const duplicate = estate.rows.length > 0 ? false : true
    response.res(duplicate)
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
          console.log('sending email to ', email, 'code', code)
        })
      )
      trx.commit()
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
        })
      )
    }
    return response.res(rows)
  }
}

module.exports = EstateController
