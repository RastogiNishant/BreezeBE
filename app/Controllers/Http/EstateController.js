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
const HttpException = use('App/Exceptions/HttpException')
const Drive = use('Drive')

const {
  STATUS_ACTIVE,
  STATUS_EXPIRE,
  STATUS_DRAFT,
  STATUS_DELETE,
  ERROR_BUDDY_EXISTS,
  DATE_FORMAT,
  DAY_FORMAT,
  MATCH_STATUS_TOP,
  MATCH_STATUS_COMMIT,
  MATCH_STATUS_NEW,
} = require('../../constants')

class EstateController {
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

  /**
   *
   */
  async getEstates({ request, auth, response }) {
    const { limit, page, ...params } = request.all()

    // Update expired estates status to unpublished
    await EstateService.getEstates(params)
      .where('user_id', auth.user.id)
      .where('status', STATUS_EXPIRE)
      .whereNot('status', STATUS_DELETE)
      .update({ status: STATUS_DRAFT })

    const result = await EstateService.getEstates(params)
      .where('user_id', auth.user.id)
      .whereNot('status', STATUS_DELETE)
      .whereNot('area', 0)
      .paginate(page, limit)

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
  async importEstate({ request, auth, response }) {
    const importFilePathName = request.file('file')

    if( importFilePathName && importFilePathName.tmpPath ){
      if( importFilePathName.headers['content-type'] !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ){
        throw new HttpException('No excel format', 400 );  
      }
      const result = await ImportService.process(importFilePathName.tmpPath, auth.user.id, 'xls')
      return response.res(result)
    }else {
      throw new HttpException('There is no excel data to import', 400 );
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
          await EstateService.publishEstate(estate)
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
    const finalMatches = [MATCH_STATUS_TOP, MATCH_STATUS_COMMIT]
    let estates = {}
    if (filter == 1) {
      estates = await Estate.query()
        .where({ user_id: userId })
        .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
        .where('to_date', '<', currentDay.format(DAY_FORMAT))
        .orderBy('id')
        .fetch()
    }

    if (filter == 2) {
      estates = await Estate.query()
        .where({ user_id: userId })
        .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
        .with('slots')
        .whereHas('slots', (estateQuery) => {
          estateQuery.where('end_at', '<=', currentDay.format(DATE_FORMAT))
        })
        .orderBy('id')
        .fetch()
    }

    if (filter == 3) {
      estates = await Estate.query()
        .where({ user_id: userId })
        .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
        .with('matches')
        .whereHas('matches', (estateQuery) => {
          estateQuery.whereIn('status', [MATCH_STATUS_NEW]).where('buddy', true)
        })
        .orderBy('id')
        .fetch()
    }

    if (filter == 4) {
      estates = await Estate.query()
        .where({ user_id: userId })
        .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
        .with('matches')
        .whereHas('matches', (estateQuery) => {
          estateQuery.whereIn('status', finalMatches)
        })
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
    const estate = await Estate.findByOrFail({ id: estate_id, user_id: auth.user.id })

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

    response.res(estates.toJSON({ isShort: true }))
  }

  /**
   *
   */
  async getTenantEstate({ request, response }) {
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

    response.res(estate)
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
      await MatchService.addBuddy(estate.id, auth.user.id)
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
    const { id } = request.all()
    const estate = await Estate.query().where({ property_id: id }).orderBy('id').fetch()
    const duplicate = estate.rows.length > 0 ? false : true
    response.res(duplicate)
  }
}

module.exports = EstateController
