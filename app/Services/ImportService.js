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
const Estate = use('App/Models/Estate')
const User = use('App/Models/User')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const Room = use('App/Models/Room')
const schema = require('../Validators/CreateBuddy').schema()

const {
  STATUS_DRAFT,
  DATE_FORMAT,
  BUDDY_STATUS_PENDING,
  STATUS_ACTIVE,
  ROLE_USER,
} = require('../constants')
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
    return await reader.readFileEstateImport(filePath)
  }

  static async readBuddyFile(filePath) {
    const reader = new BuddiesReader()
    return await reader.readFile(filePath)
  }

  /**
   *
   */
  static async createSingleEstate({ data, line, six_char_code }, userId) {
    let estate
    if (six_char_code) {
      //check if this is an edit...
      estate = await Estate.query().where('six_char_code', six_char_code).where('user_id', userId)
      if (!estate) {
        return { error: [`${six_char_code} is an invalid Breeze ID`], line, address: data.address }
      }
      //TODO: update Estate...
    } else {
      try {
        if (!data.address) {
          throw new AppException('Invalid address')
        }
        const address = data.address.toLowerCase()
        const existingEstate = await EstateService.getQuery()
          .where('user_id', userId)
          .where('address', 'LIKE', `%${address}%`)
          .first()

        if (existingEstate) {
          await EstateService.completeRemoveEstate(existingEstate.id)
        }
        data.avail_duration = 144
        data.status = STATUS_DRAFT
        data.available_date = data.available_date || moment().format(DATE_FORMAT)
        if (data.letting_status) {
          data.letting_type = data.letting_status.type
          data.letting_status = data.letting_status.status || null
        }
        estate = await EstateService.createEstate(data, userId)

        //await RoomService.createBulkRooms(estate.id, data)
        let rooms = []
        let found
        for (let key in data) {
          if ((found = key.match(/^room(\d)_type$/))) {
            rooms.push({ ...data[key], import_sequence: found[1] })
          }
        }
        if (rooms.length) {
          await ImportService.createRoomsFromImport(estate.id, rooms)
        }

        // Run task to separate get coords and point of estate
        QueueService.getEstateCoords(estate.id)

        //add current tenant
        if (data.tenant_email) {
          //check if a current user
          let user = await User.query()
            .where('email', data.tenant_email)
            .where('role', ROLE_USER)
            .first()

          let currentTenant = new EstateCurrentTenant()
          currentTenant.fill({
            estate_id: estate.id,
            salutation: data.txt_salutation || '',
            surname: data.surname || '',
            email: data.tenant_email,
            contract_end: data.contract_end,
            phone_number: data.tenant_tel,
            status: STATUS_ACTIVE,
          })
          if (user) {
            currentTenant.user_id = user.id
          }
          await currentTenant.save()
        }

        return estate
      } catch (e) {
        return { error: [e.message], line, address: data.address }
      }
    }
  }

  static async createRoomsFromImport(estate_id, rooms) {
    const roomsInfo = rooms.reduce((roomsInfo, room, index) => {
      return [...roomsInfo, { ...room, estate_id }]
    }, [])
    await Room.createMany(roomsInfo)
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
  static async process(filePath, userId, type) {
    let { errors, data, warnings } = await ImportService.readFileFromWeb(filePath)

    const opt = { concurrency: 1 }
    const result = await Promise.map(data, (i) => ImportService.createSingleEstate(i, userId), opt)

    const createErrors = result.filter((i) => has(i, 'error') && has(i, 'line'))

    return {
      errors: [...errors, ...createErrors],
      success: result.length - createErrors.length,
      warnings,
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
    const { errors, data } = await ImportService.readFileFromWeb(filePath)

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
