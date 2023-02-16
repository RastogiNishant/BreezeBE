'use strict'

const Database = use('Database')
const EstateService = use('App/Services/EstateService')
const HttpException = use('App/Exceptions/HttpException')
const File = use('App/Classes/File')

const { MATCH_STATUS_VISIT, MATCH_STATUS_SHARE } = require('../../constants')

class TimeSlotController {
  async getUpcomingShows({ request, auth, response }) {
    const { page, limit, query } = request.all()
    const userId = auth.user.id
    try {
      const result = await EstateService.getUpcomingShows(userId, query).paginate(page, limit)

      return response.res(result)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = TimeSlotController
