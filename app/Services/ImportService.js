const Promise = require('bluebird')
const { has, omit, isEmpty } = require('lodash')
const moment = require('moment')
const EstateImportReader = use('App/Classes/EstateImportReader')
const Database = use('Database')
const BuddiesReader = use('App/Classes/BuddiesReader')
const EstatePermissionService = use('App/Services/EstatePermissionService')
const Buddy = use('App/Models/Buddy')
const Estate = use('App/Models/Estate')
const HttpException = use('App/Exceptions/HttpException')
const AppException = use('App/Exceptions/AppException')
const Ws = use('Ws')
const FileBucket = use('App/Classes/File')
const schema = require('../Validators/CreateBuddy').schema()
const {
  STATUS_DRAFT,
  DATE_FORMAT,
  BUDDY_STATUS_PENDING,
  STATUS_ACTIVE,
  LETTING_TYPE_NA,
  ISO_DATE_FORMAT,
  IMPORT_TYPE_EXCEL,
  IMPORT_ENTITY_ESTATES,
  WEBSOCKET_EVENT_IMPORT_EXCEL,
  IMPORT_ACTIVITY_DONE,
  LETTING_TYPE_LET,
  STATUS_DELETE,
} = require('../constants')
const Import = use('App/Models/Import')
const EstateCurrentTenantService = use('App/Services/EstateCurrentTenantService')

/**
 *
 */
class ImportService {
  static async readBuddyFile(filePath) {
    const reader = new BuddiesReader()
    return await reader.readFile(filePath)
  }

  /**
   *
   */
  static async createSingleEstate({ data, line, six_char_code }, userId) {
    let estate
    const trx = await Database.beginTransaction()
    try {
      if (six_char_code) {
        //check if this is an edit...
        estate = await Estate.query()
          .where('six_char_code', six_char_code)
          .where('user_id', userId)
          .first()
        if (!estate) {
          await trx.rollback()
          return {
            error: [`${six_char_code} is an invalid Breeze ID`],
            line,
            address: data.address,
          }
        }
        await ImportService.updateImportBySixCharCode({ six_char_code, data }, trx)
      } else {
        if (!data.address) {
          return {
            error: [`address is empty`],
            line,
            address: data.address,
          }
        }
        const address = data.address.toLowerCase()
        const existingEstate = await require('./EstateService')
          .getQuery()
          .where('user_id', userId)
          .where('address', 'LIKE', `%${address}%`)
          .whereNot('status', STATUS_DELETE)
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

        estate = await require('./EstateService').createEstate({ data, userId }, true, trx)
        let rooms = []
        let found
        for (let key in data) {
          if ((found = key.match(/^room(\d)_type$/)) && !isEmpty(data[key])) {
            rooms.push({ ...data[key], import_sequence: found[1] })
          }
        }
        if (rooms.length) {
          await require('./RoomService').createRoomsFromImport({ estate_id: estate.id, rooms }, trx)
        }

        //add current tenant
        if (data.letting_type === LETTING_TYPE_LET) {
          await EstateCurrentTenantService.addCurrentTenant(
            {
              data,
              estate_id: estate.id,
            },
            trx
          )
        }
        if (warning) {
          await trx.rollback()
          return { warning, line, address: data.address }
        }
      }
      await trx.commit()

      if (!six_char_code) {
        await Estate.updateBreezeId(estate.id)
      }
      // Run task to separate get coords and point of estate
      require('./QueueService').getEstateCoords(estate.id)

      return estate
    } catch (e) {
      await trx.rollback()
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
   * s3_bucket_file_name: s3 bucket relative URL
   */
  static async process({ s3_bucket_file_name, filePath, user_id, type, import_id }) {
    let createErrors = []
    let result = []
    let errors = []
    let data = []
    let warnings = []
    try {
      const url = await FileBucket.getProtectedUrl(s3_bucket_file_name)
      const localPath = await FileBucket.saveFileTo({ url, ext: 'xlsx' })
      const reader = new EstateImportReader(localPath)
      const excelData = await reader.process()
      errors = excelData.errors
      warnings = excelData.warnings
      data = excelData.data
      const opt = { concurrency: 1 }
      result = await Promise.map(
        data,
        async (i) => {
          if (i) await ImportService.createSingleEstate(i, user_id)
        },
        opt
      )
      createErrors = result.filter((i) => has(i, 'error') && has(i, 'line'))
      result.map((row) => {
        if (has(row, 'warning')) {
          warnings.push(row.warning)
        }
      })
    } catch (err) {
      errors = [...errors, err.message]
    } finally {
      FileBucket.remove(s3_bucket_file_name, false)
      if (import_id && !isNaN(import_id)) {
        await ImportService.completeImportFile(import_id)
      }
      this.emitImported({
        user_id,
        data: {
          last_activity: {
            file: filePath?.clientName || null,
            created_at: moment().utc().format(),
          },
          errors: [...errors, ...createErrors],
          success: result.length - createErrors.length,
          warnings: [...warnings],
        },
      })
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

  static async emitImported({ data, user_id }) {
    const channel = `landlord:*`
    const topicName = `landlord:${user_id}`
    const topic = Ws.getChannel(channel).topic(topicName)

    if (topic) {
      topic.broadcast(WEBSOCKET_EVENT_IMPORT_EXCEL, data)
    }
  }

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

  static async updateImportBySixCharCode({ six_char_code, data }, trx) {
    try {
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
      const user_id = estate.user_id
      if (!estate) {
        throw new HttpException('estate no exists')
      }
      if (!estate_data.letting_type) {
        estate_data.letting_type = LETTING_TYPE_NA
      }
      estate_data.id = estate.id
      estate.fill(estate_data)
      await estate.save(trx)

      if (data.letting_type === LETTING_TYPE_LET) {
        await EstateCurrentTenantService.updateCurrentTenant(
          {
            data,
            estate_id: estate.id,
            user_id,
          },
          trx
        )
      } else {
        await EstateCurrentTenantService.deleteByEstate(
          {
            estate_ids: [estate.id],
            user_id,
          },
          trx
        )
      }
      //update Rooms
      let rooms = []
      let found
      for (let key in data) {
        if ((found = key.match(/^room(\d)_type$/)) && data[key]) {
          rooms.push({ ...data[key], import_sequence: found[1] })
        }
      }
      if (rooms.length) {
        await require('./RoomService').updateRoomsFromImport({ estate_id: estate.id, rooms }, trx)
      } else {
        await require('./RoomService').removeAllRoom(estate.id, trx)
      }

      return estate
    } catch (e) {
      throw new HttpException(e.message, e.status || 500)
    }
  }

  static async addImportFile({
    user_id,
    filename,
    type = IMPORT_TYPE_EXCEL,
    entity = IMPORT_ENTITY_ESTATES,
    status,
  }) {
    return await Import.createItem({ user_id, filename, type, entity, status })
  }

  static async completeImportFile(id) {
    return await Import.query().where('id', id).update({ status: IMPORT_ACTIVITY_DONE })
  }

  static async getLastImportActivities(user_id) {
    const importActivity = await Database.raw(
      `SELECT 
      type, filename, action, to_char(created_at, '${ISO_DATE_FORMAT}') as created_at, status
    FROM imports
    WHERE (type, action, created_at) in 
    (
      SELECT type, action, MAX(created_at)
      FROM imports
      where user_id=${user_id}
      GROUP BY type, action
    )`
    )
    let ret = {
      excel: {
        import: {},
        export: {},
      },
      openimmo: {
        import: {},
        export: {},
      },
    }
    if (importActivity) {
      importActivity.rows.map((row) => {
        ret[row.type][row.action] = row
      })
    }
    return ret
  }

  static async postLastActivity({ user_id, filename, action, type, entity }) {
    const trx = await Database.beginTransaction()
    try {
      await Import.createItem(
        { user_id, filename, action, type, entity, status: IMPORT_ACTIVITY_DONE },
        trx
      )
      await trx.commit()
      return true
    } catch (err) {
      await trx.rollback()
      console.log(err.message)
      return false
    }
  }
}

module.exports = ImportService
