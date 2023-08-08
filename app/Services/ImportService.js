const Promise = require('bluebird')
const { has, omit, isEmpty, trim, property } = require('lodash')
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
const Logger = use('Logger')
const fsPromise = require('fs/promises')
const l = use('Localize')
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
  IMPORT_ACTIVITY_PENDING,
  LETTING_TYPE_LET,
  STATUS_DELETE,
  IMPORT_ACTION_IMPORT,
  IMPORT_ACTION_EXPORT,
  WEBSOCKET_EVENT_IMPORT_EXCEL_PROGRESS,
  PREPARING_TO_UPLOAD,
  PROPERTY_HANDLE_FINISHED,
  WEBSOCKET_TENANT_REDIS_KEY,
  WEBSOCKET_LANDLORD_REDIS_KEY,
  PUBLISH_STATUS_APPROVED_BY_ADMIN,
} = require('../constants')
const {
  exceptions: { ERROR_PROPERTY_PUBLISHED_CAN_BE_EDITABLE },
} = require('../exceptions')
const BuildingService = require('./BuildingService')
const WebSocket = use('App/Classes/Websocket')
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

  static async createSingleEstate({ property, buildings, userId, lang }) {
    let data = property.data
    let line = property.line
    let six_char_code = property.six_char_code

    const build_id = data.building_id
      ? (buildings || []).filter((b) => b.building_id === data.building_id)[0]?.id
      : null

    data.build_id = build_id

    let estate
    line += 1
    const warnings = []
    const trx = await Database.beginTransaction()
    try {
      if (six_char_code) {
        //check if this is an edit...
        estate = await Estate.query()
          .where('six_char_code', six_char_code)
          .where('user_id', userId)
          .whereNot('status', STATUS_DELETE)
          .first()
        if (!estate) {
          await trx.rollback()
          return {
            singleErrors: {
              error: [`${six_char_code} is an invalid Breeze ID`],
              line,
              property_id: data.property_id,
              address: data.address,
            },
          }
        }

        if (estate.published_status === PUBLISH_STATUS_APPROVED_BY_ADMIN) {
          await trx.rollback()
          return {
            singleErrors: {
              error: [
                l
                  .get('landlord.web.my-properties.import.txt_online_id_not_editable', lang)
                  .replace('{{property_id}}', data.property_id),
              ],
              line,
              property_id: data.property_id,
              address: data.address,
            },
          }
        }

        await ImportService.updateImportBySixCharCode({ estate, data }, trx)
      } else {
        if (!data.address) {
          await trx.rollback()
          return {
            singleErrors: {
              error: [`address is empty`],
              line,
              address: data.address,
              property_id: data.property_id,
            },
          }
        }

        data.status = STATUS_DRAFT
        data.available_start_at = null
        data.available_end_at = null
        if (!data.letting_type) {
          data.letting_type = LETTING_TYPE_NA
        }

        estate = await require('./EstateService').createEstate({ data, userId }, true, trx)
        let rooms = []
        let found
        for (let key in data) {
          if ((found = key.match(/^room(\d)_type$/)) && !isEmpty(data[key])) {
            rooms.push({ ...data[key], order: found[1] })
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
        } else {
          if (
            trim(data.email || ``) != '' ||
            trim(data.phone_number || ``) != '' ||
            trim(data.txt_salutation || ``) !== '' ||
            trim(data.surname || ``) !== '' ||
            trim(data.rent_end_at || ``) !== ''
          ) {
            warnings.push({
              error: [`Tenant info igonored because this property has not rented yet`],
              line,
              address: data.address,
              property_id: data.property_id,
            })
          }
        }
      }
      await trx.commit()

      if (!six_char_code) {
        await Estate.updateBreezeId(estate.id)
      }
      // Run task to separate get coords and point of estate
      require('./QueueService').getEstateCoords(estate.id)

      return { estateResult: estate, singleWarnings: warnings }
    } catch (e) {
      console.log('createSingleEstate error', e.message)
      await trx.rollback()
      return { singleErrors: { error: [e.message], line, address: data.address, estate: null } }
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
  static async process({ s3_bucket_file_name, filePath, user_id, type, import_id, lang }) {
    let createErrors = []
    let result = []
    let errors = []
    let data = []
    let warnings = []
    try {
      this.emitImported({
        data: {
          message: PREPARING_TO_UPLOAD,
        },
        user_id,
      })

      Logger.info(`${user_id} getting s3 bucket url!!! ${s3_bucket_file_name}`)
      const url = await FileBucket.getPublicUrl(s3_bucket_file_name)
      Logger.info(`storing excel file to s3 bucket!!! ${url}`)
      const localPath = await FileBucket.saveFileTo({ url: s3_bucket_file_name, ext: 'xlsx' })
      Logger.info(`saved file to path ${localPath}`)
      const reader = new EstateImportReader()
      reader.init(localPath)
      Logger.info('processing excel file!!!')
      const excelData = await reader.process()
      errors = excelData.errors
      warnings = excelData.warnings
      data = excelData.data

      fsPromise.unlink(localPath)

      //add/update building
      const buildingsData = (data.building || []).map((building) => building.data)

      await BuildingService.bulkUpsert(user_id, buildingsData)
      const buildings = await BuildingService.getAll(user_id)

      result = await Promise.map(
        data?.unit || [],
        async (i, index) => {
          if (i) {
            const { estateResult, singleWarnings, singleErrors } =
              await ImportService.createSingleEstate({
                property: i,
                buildings,
                userId: user_id,
                lang,
              })

            if (singleErrors) {
              createErrors = createErrors.concat(singleErrors)
            }
            if (singleWarnings?.length) {
              warnings = warnings.concat(singleWarnings)
            }

            ImportService.emitImported({
              data: {
                message: PROPERTY_HANDLE_FINISHED,
                count: errors?.length + index + 1,
                total: data.length + errors?.length,
                result: estateResult,
                errors: singleErrors || [],
                warnings: singleWarnings || [],
              },
              user_id,
            })
            return estateResult
          }
          return {}
        },
        { concurrency: 1 }
      )
    } catch (err) {
      errors = [...errors, ...createErrors, err.message]
      console.log(`${user_id} import excel error ${err}`)
    } finally {
      //correct wrong data during importing excel files
      Logger.info('finallizing import excel')
      if (import_id && !isNaN(import_id)) {
        await ImportService.completeImportFile(import_id)
      }

      await require('./EstateService').correctWrongEstates(user_id)
      //TODO: this has to be uncommented later, for now to test only.
      //FileBucket.remove(s3_bucket_file_name, false)
      Logger.info(`${user_id} Sending completed excel websocket event`)
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
        event: WEBSOCKET_EVENT_IMPORT_EXCEL,
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

  static async emitImported({ data, user_id, event = WEBSOCKET_EVENT_IMPORT_EXCEL_PROGRESS }) {
    WebSocket.publishToLandlord({ event, userId: user_id, data })
  }

  //TODO: if a property is already published, no need to update property responding error message
  static async updateImportBySixCharCode({ estate, data }, trx) {
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
        'phone_number',
        'email',
        'salutation_int',
      ])

      if (!estate) {
        throw new HttpException('estate no exists')
      }

      const user_id = estate.user_id
      if (!estate_data.letting_type) {
        estate_data.letting_type = LETTING_TYPE_NA
      }

      const estateCurrentTenants = await EstateCurrentTenantService.getActiveByEstateIds([
        estate.id,
      ])

      //Recalculating address by disconnected connect (no tenants connected) and unpublished match units (no prospects associated)
      //so addrss can only be updated only in the cases above
      if (
        (data.letting_type === LETTING_TYPE_LET && estateCurrentTenants?.length) ||
        estate.status === STATUS_ACTIVE
      ) {
        estate_data = omit(estate_data, ['city', 'country', 'zip', 'street', 'house_number'])
        estate_data.is_coord_changed = false
      } else {
        estate_data.is_coord_changed = true
      }

      await require('./EstateService').updateEstate(
        {
          data: { ...estate_data, id: estate.id },
          user_id,
        },
        trx
      )
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
        //TODO: Do we really need to delete current estate if letting type changed from importing excel????
        if (estateCurrentTenants && estateCurrentTenants.length) {
          await EstateCurrentTenantService.deleteByEstate(
            {
              estate_ids: [estate.id],
              user_id,
            },
            trx
          )
        }
      }
      //update Rooms
      let rooms = []
      let found
      for (let key in data) {
        if ((found = key.match(/^room(\d)_type$/)) && data[key]) {
          rooms.push({ ...data[key], order: found[1] })
        }
      }
      if (rooms.length) {
        await require('./RoomService').updateRoomsFromImport({ estate_id: estate.id, rooms }, trx)
      } else {
        // we don't have to remove rooms because some rooms will have images for now, if user is going to delete rooms, he has to remove it via web frontend manually
        //TODO: only has to remove rooms which don't have images & reindex room names according to room type
        //await require('./RoomService').removeAllRoom(estate.id, trx)
      }
      require('./QueueService').getEstateCoords(estate.id)
      return estate
    } catch (e) {
      console.log('update estate error happened=', e.message)
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

  static async hasPreviousAction({ user_id, action }) {
    const actionRow = await Import.query()
      .where('user_id', user_id)
      .where('action', action)
      .orderBy('id', 'desc')
      .first()
    if (actionRow && actionRow.status === IMPORT_ACTIVITY_PENDING) {
      return true
    }
    return false
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
        imported: {},
        exported: {},
      },
      openimmo: {
        imported: {},
        exported: {},
      },
    }
    if (importActivity) {
      importActivity.rows.map((row) => {
        const key =
          row.action === IMPORT_ACTION_IMPORT
            ? 'imported'
            : row.action === IMPORT_ACTION_EXPORT
            ? 'exported'
            : row.action
        ret[row.type][key] = row
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
