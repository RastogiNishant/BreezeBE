const Promise = require('bluebird')
const { has, omit, isEmpty } = require('lodash')
const moment = require('moment')
const Database = use('Database')
const ExcelReader = use('App/Classes/ExcelReader')
const BuddiesReader = use('App/Classes/BuddiesReader')
const EstateService = use('App/Services/EstateService')
const QueueService = use('App/Services/QueueService')
const RoomService = use('App/Services/RoomService')
const EstatePermissionService = use('App/Services/EstatePermissionService')
const AppException = use('App/Exceptions/AppException')
const Buddy = use('App/Models/Buddy')
const Estate = use('App/Models/Estate')
const schema = require('../Validators/CreateBuddy').schema()

const {
  STATUS_DRAFT,
  DATE_FORMAT,
  BUDDY_STATUS_PENDING,
  STATUS_ACTIVE,
  LETTING_TYPE_NA,
  IMPORT_TYPE_EXCEL,
  IMPORT_ENTITY_ESTATES,
  ISO_DATE_FORMAT,
} = require('../constants')
const Import = use('App/Models/Import')
const EstateCurrentTenantService = use('App/Services/EstateCurrentTenantService')
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
      estate = await Estate.query()
        .where('six_char_code', six_char_code)
        .where('user_id', userId)
        .first()
      if (!estate) {
        return { error: [`${six_char_code} is an invalid Breeze ID`], line, address: data.address }
      }
      await ImportService.updateImportBySixCharCode(six_char_code, data)
    } else {
      try {
        if (!data.address) {
          throw new AppException('Invalid address')
        }
        const address = data.address.toLowerCase()
        const existingEstate = await EstateService.getQuery()
          .where('user_id', userId)
          .where('address', 'LIKE', `%${address}%`)
          .where('status', STATUS_ACTIVE)
          .first()
        let warning
        if (existingEstate) {
          //await EstateService.completeRemoveEstate(existingEstate.id)
          warning = `Probably duplicate found on address: ${address}. Please use Breeze ID if you want to update.`
        }
        data.avail_duration = 144
        data.status = STATUS_DRAFT
        data.available_date = data.available_date || moment().format(DATE_FORMAT)
        if (!data.letting_type) {
          data.letting_type = LETTING_TYPE_NA
        }
        estate = await EstateService.createEstate({ data, userId }, true)

        let rooms = []
        let found
        for (let key in data) {
          if ((found = key.match(/^room(\d)_type$/)) && !isEmpty(data[key])) {
            rooms.push({ ...data[key], import_sequence: found[1] })
          }
        }
        if (rooms.length) {
          await RoomService.createRoomsFromImport(estate.id, rooms)
        }

        // Run task to separate get coords and point of estate
        QueueService.getEstateCoords(estate.id)
        //await EstateService.updateEstateCoord(estate.id)
        //add current tenant
        if (data.surname) {
          await EstateCurrentTenantService.addCurrentTenant({
            data,
            estate_id: estate.id,
          })
        }
        if (warning) {
          return { warning, line, address: data.address }
        }
        return estate
      } catch (e) {
        return { error: [e.message], line, address: data.address }
      }
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
  static async process(filePath, userId, type) {
    let { errors, data, warnings } = await ImportService.readFileFromWeb(filePath)

    const opt = { concurrency: 1 }
    const result = await Promise.map(data, (i) => ImportService.createSingleEstate(i, userId), opt)

    const createErrors = result.filter((i) => has(i, 'error') && has(i, 'line'))
    result.map((row) => {
      if (has(row, 'warning')) {
        warnings.push(row.warning)
      }
    })

    return {
      errors: [...errors, ...createErrors],
      success: result.length - createErrors.length,
      warnings: [...warnings],
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

  static async updateImportBySixCharCode(six_char_code, data) {
    let estate_data = omit(data, [
      'room1_type',
      'room2_type',
      'room3_type',
      'room4_type',
      'room5_type',
      'room6_type',
      'txt_salutation',
      'surname',
      'contract_end',
      'phone_number',
      'email',
      'salutation_int',
    ])
    let estate = await Estate.query().where('six_char_code', six_char_code).first()
    if (!estate) {
      throw new HttpException('estate no exists')
    }
    if (!estate_data.letting_type) {
      estate_data.letting_type = LETTING_TYPE_NA
    }
    estate_data.id = estate.id
    estate.fill(estate_data)
    await estate.save()

    if (data.email) {
      await EstateCurrentTenantService.updateCurrentTenant({
        data,
        estate_id: estate.id,
        user_id: estate.user_id,
      })
    }
    //update Rooms
    let rooms = []
    let found
    for (let key in data) {
      if ((found = key.match(/^room(\d)_type$/))) {
        rooms.push({ ...data[key], import_sequence: found[1] })
      }
    }
    if (rooms.length) {
      await RoomService.updateRoomsFromImport(estate.id, rooms)
    }

    // Run task to separate get coords and point of estate
    QueueService.getEstateCoords(estate.id)
    //await EstateService.updateEstateCoord(estate.id)
    // if (data.email) {
    //   await EstateCurrentTenantService.updateCurrentTenant(data, estate.id)
    // }
    return estate
  }

  static async addImportFile({
    user_id,
    filename,
    type = IMPORT_TYPE_EXCEL,
    entity = IMPORT_ENTITY_ESTATES,
  }) {
    await Import.query().insert({ user_id, filename, type, entity })
  }

  static async getLastImportActivities(
    user_id,
    type = IMPORT_TYPE_EXCEL,
    entity = IMPORT_ENTITY_ESTATES
  ) {
    const import_activity = await Import.query()
      .select(Database.raw(`to_char(created_at, '${ISO_DATE_FORMAT}') as created_at`))
      .select('filename')
      .where({ user_id, type, entity })
      .orderBy('created_at', 'desc')
      .first()

    return import_activity
  }
}

module.exports = ImportService
