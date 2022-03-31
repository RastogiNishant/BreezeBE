const Promise = require('bluebird')
const { has } = require('lodash')
const moment = require('moment')
const xlsx = require('node-xlsx')
const Excel = require('exceljs')
const ExcelReader = use('App/Classes/ExcelReader')
const BuddiesReader = use('App/Classes/BuddiesReader')
const EstateService = use('App/Services/EstateService')
const QueueService = use('App/Services/QueueService')
const RoomService = use('App/Services/RoomService')
const EstatePermissionService = use('App/Services/EstatePermissionService')
const AppException = use('App/Exceptions/AppException')
const Buddy = use('App/Models/Buddy')
const schema = require('../Validators/CreateBuddy').schema()

const { STATUS_DRAFT, DATE_FORMAT, BUDDY_STATUS_PENDING } = require('../constants')
const HttpException = use('App/Exceptions/HttpException')

/**
 *
 */
class ImportService {
  /**
   *
   */
  static async readFile(filePath) {
    const reader = new ExcelReader()
    return await reader.readFile(filePath)
  }

  static async readFileFromWeb(filePath) {
    const reader = new ExcelReader()
    reader.headerCol = 1
    reader.sheetName = 'Import_Data'
    return await reader.readFile(filePath)
  }

  static async readBuddyFile(filePath) {
    const reader = new BuddiesReader()
    return await reader.readFile(filePath)
  }

  /**
   *
   */
  static async createSingleEstate({ data, line }, userId) {
    try {
      if (!data.address) {
        throw new AppException('Invalid address')
      }
      const existingEstate = await EstateService.getQuery()
        .where('user_id', userId)
        .where('address', 'LIKE', `%${data.address.toLowerCase()}%`)
        .first()

      if (existingEstate) {
        await EstateService.completeRemoveEstate(existingEstate.id)
      }

      data.avail_duration = 144
      data.status = STATUS_DRAFT
      data.available_date = data.available_date || moment().format(DATE_FORMAT)

      const estate = await EstateService.createEstate(data, userId)
      await RoomService.createBulkRooms(estate.id, data)
      // Run task to separate get coords and point of estate
      QueueService.getEstateCoords(estate.id)
      return estate
    } catch (e) {
      return { error: [e.message], line, address: data.address }
    }
  }

  /**
   *
   */
  static async createSingleBuddy(data, userId) {
    const result = await schema.validate(data)
    const buddy = new Buddy()
    buddy.name = result.name
    buddy.phone = result.phone
    buddy.email = result.email
    buddy.user_id = userId
    buddy.status = BUDDY_STATUS_PENDING

    await buddy.save()
  }

  /**
   *
   */
  static async processBuddies(filePath, userId, type) {
    const { errors, data } = await ImportService.readBuddyFile(filePath)
    const result = await Promise.map(data, (i) => ImportService.createSingleBuddy(i, userId))
    return {
      success: result.length,
    }
  }
  /**
   *
   */
  static async process(filePath, userId, type, from_web = false) {
    let { errors, data } = from_web
      ? await ImportService.readFileFromWeb(filePath)
      : ImportService.readFile(filePath)

    const opt = { concurrency: 1 }
    const result = await Promise.map(data, (i) => ImportService.createSingleEstate(i, userId), opt)

    const createErrors = result.filter((i) => has(i, 'error') && has(i, 'line'))

    return {
      errors: [...errors, ...createErrors],
      success: result.length - createErrors.length,
    }
  }

  //import estate process by property manager
  /**
   *
   * @param {*} filePath
   * @param {*} userId : property manager Id
   * @param {*} type
   * @returns
   */

  static async processByPM(filePath, userId, type) {
    const { errors, data } = await ImportService.readFile(filePath)

    const opt = { concurrency: 0 }

    const result = await Promise.map(
      data,
      async (i) => {
        if (!i || !i.data || !i.data.landlord_email) {
          return {
            error: `Landlord email is not defined`,
            line: i.line,
            address: i ? i.data.address : `no address here`,
            postcode: i ? i.data.zip : `no zip code here`,
          }
        }

        const estatePermission = await EstatePermissionService.getLandlordHasPermissionByEmail(
          userId,
          i.data.landlord_email
        )

        if (!estatePermission || !estatePermission.landlord_id) {
          return {
            error: `You don't have permission for that property`,
            line: i.line,
            address: i ? i.data.address : `no address here`,
            postcode: i ? i.data.zip : `no zip code here`,
          }
        }

        await ImportService.createSingleEstate(i, estatePermission.landlord_id)
      },
      opt
    )

    const createErrors = result.filter((i) => has(i, 'error') && has(i, 'line'))

    return {
      errors: [...errors, ...createErrors],
      success: result.length - createErrors.length,
    }
  }
}

module.exports = ImportService
