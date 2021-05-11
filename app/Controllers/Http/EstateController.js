'use strict'

const uuid = require('uuid')
const moment = require('moment')
const { isArray } = require('lodash')

const Estate = use('App/Models/Estate')
const File = use('App/Models/File')
const OptionService = use('App/Services/OptionService')
const EstateService = use('App/Services/EstateService')
const QueueService = use('App/Services/QueueService')
const ImportService = use('App/Services/ImportService')
const HttpException = use('App/Exceptions/HttpException')
const Drive = use('Drive')
const Logger = use('Logger')

const { STATUS_ACTIVE, STATUS_DRAFT, STATUS_DELETE } = require('../../constants')

class EstateController {
  /**
   *
   */
  async createEstate({ request, auth, response }) {
    const { options, ...data } = request.all()
    const estate = await EstateService.createEstate(data, auth.user.id)
    // Create options estate link
    if (isArray(options)) {
      await OptionService.updateEstateOptions(estate, options)
    }
    // Run processing estate geo nearest
    QueueService.getEstatePoint(estate.id)
    response.res(estate)
  }

  /**
   *
   */
  async updateEstate({ request, auth, response }) {
    const { id, options, ...data } = request.all()
    const estate = await Estate.findOrFail(id)
    if (estate.user_id !== auth.user.id) {
      throw new HttpException('Not allow', 403)
    }
    await estate.updateItem(data)
    // Create/Update options estate link
    if (isArray(options)) {
      await OptionService.updateEstateOptions(estate, options)
    }

    // Run processing estate geo nearest
    QueueService.getEstatePoint(estate.id)

    response.res(estate)
  }

  /**
   *
   */
  async getEstates({ request, auth, response }) {
    const { limit, page, ...params } = request.all()
    const result = await EstateService.getEstates(params)
      .where('user_id', auth.user.id)
      .whereNot('status', STATUS_DELETE)
      .paginate(page, limit)

    response.res(result)
  }

  /**
   * Get single estate with POI
   */
  async getEstate({ request, auth, response }) {
    const { id } = request.all()
    const estate = await EstateService.getEstateQuery()
      .where('id', id)
      .where('user_id', auth.user.id)
      .whereNot('status', STATUS_DELETE)
      .with('point')
      .with('files')
      .with('options')
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
    const result = await ImportService.process(importFilePathName.tmpPath, auth.user.id, 'xls')

    response.res(result)
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
    // TODO: validate publish ready
    await estate.updateItem({ status: action === 'publish' ? STATUS_ACTIVE : STATUS_DRAFT }, true)
    response.res(true)
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
  async getTenantEstates({ request, response }) {
    const { limit, page } = request.all()
    const result = await EstateService.getEstates({})
      .where('status', STATUS_ACTIVE)
      .paginate(page, limit)

    response.res(result)
  }

  /**
   *
   */
  async getTenantEstate({ request, response }) {
    const { id } = request.all()

    const estate = await EstateService.getEstateQuery()
      .with('point')
      .with('files')
      .with('options')
      .with('rooms', function (b) {
        b.where('status', STATUS_ACTIVE).with('images')
      })
      .where('id', id)
      .where('status', STATUS_ACTIVE)
      .first()

    if (!estate) {
      throw new HttpException('Invalid estate', 404)
    }

    response.res(estate)
  }

  /**
   *
   */
  async acceptEstateInvite({ request, response }) {
    const { code } = request.all()
    const estate = await EstateService.getEstateByHash(code)
    if (!estate) {
      throw HttpException('Estate not exists', 404)
    }

    // TODO: Apply buddy invite

    response.res(true)
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
      throw HttpException('Estate not exists', 404)
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
    const { estate_id, slot_id, week_day, ...rest } = request.all()
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
    response.res('Should implement')
  }
}

module.exports = EstateController
