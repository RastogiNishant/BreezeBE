const Promise = require('bluebird')
const { has } = require('lodash')
const moment = require('moment')
const xlsx = require('node-xlsx')
const Excel   = require('exceljs')
const ExcelReader = use('App/Classes/ExcelReader')
const BuddiesReader = use('App/Classes/BuddiesReader')
const EstateService = use('App/Services/EstateService')
const QueueService = use('App/Services/QueueService')
const RoomService = use('App/Services/RoomService')
const AppException = use('App/Exceptions/AppException')
const Buddy = use('App/Models/Buddy')
const schema = require('../Validators/CreateBuddy').schema()


const { STATUS_DRAFT, DATE_FORMAT } = require('../constants')

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
        .where('address', data.address.toLowerCase())
        .first()
      if (!existingEstate) {
        data.avail_duration = 144
        data.status = STATUS_DRAFT
        data.available_date = data.available_date || moment().format(DATE_FORMAT)

        const estate = await EstateService.createEstate(data, userId)
        await RoomService.createBulkRooms(estate.id, data)
        // Run task to separate get coords and point of estate
        QueueService.getEstateCoords(estate.id)
        return estate
      }
      return existingEstate.updateItem(data)
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

    await buddy.save()

  }

  /**
   *
   */
  static async processBuddies(filePath, userId, type) {
    const { errors, data } = await ImportService.readBuddyFile(filePath)
    const result = await Promise.map(data, (i) => ImportService.createSingleBuddy(i, userId)) 
    return {
      success: result.length ,
    }
  }
  /**
   *
   */
  static async process(filePath, userId, type) {
    const { errors, data } = await ImportService.readFile(filePath)

    const opt = { concurrency: 1 }
    const result = await Promise.map(data, (i) => ImportService.createSingleEstate(i, userId), opt)

    const createErrors = result.filter((i) => has(i, 'error') && has(i, 'line') )

    return {
      errors: [...errors, ...createErrors],
      success: result.length - createErrors.length,
    }
  }
}

module.exports = ImportService
