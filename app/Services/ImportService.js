const Promise = require('bluebird')
const { has } = require('lodash')

const ExcelReader = use('App/Classes/ExcelReader')
const EstateService = use('App/Services/EstateService')
const QueueService = use('App/Services/QueueService')
const AppException = use('App/Exceptions/AppException')

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

  /**
   *
   */
  static async createSingleEstate({ data, line }, userId) {
    try {
      if (!data.address) {
        throw new AppException('Invalid address')
      }
      const existingEstate = await EstateService.getEstateQuery()
        .where('user_id', userId)
        .where('address', data.address)
        .first()
      if (!existingEstate) {
        const estate = await EstateService.createEstate(data, userId)
        // Run task to separate get coords and point of estate
        QueueService.getEstateCoords(estate.id)
        return estate
      }
      return existingEstate.updateItem(data)
    } catch (e) {
      return { error: [e.message], line }
    }
  }

  /**
   *
   */
  static async process(filePath, userId, type) {
    const { errors, data } = await ImportService.readFile(filePath)
    const opt = { concurrency: 1 }
    const result = await Promise.map(data, (i) => ImportService.createSingleEstate(i, userId), opt)
    const createErrors = result.filter((i) => has(i, 'error') && has(i, 'line'))

    return {
      errors: [...errors, ...createErrors],
      success: result.length - createErrors.length,
    }
  }
}

module.exports = ImportService
