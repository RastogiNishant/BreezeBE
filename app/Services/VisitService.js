const moment = require('moment')
const Database = use('Database')

const { DATE_FORMAT } = require('../constants')

class VisitService {
  /**
   *
   */
  static async getVisitFor15H() {
    const dayStart = moment().startOf('day')
    const date15H = moment().startOf('minute').subtract(1.5, 'hours')
    const date15H5M = date15H.clone().subtract(5, 'minute')
    const subQuery = Database.select('estate_id', Database.raw('MIN(date) as date'))
      .table('visits')
      .where('date', '>=', dayStart.format(DATE_FORMAT))
      .where('date', '<', dayStart.clone().add(1, 'day').format(DATE_FORMAT))
      .groupBy('estate_id')
      .as('_t')

    return (
      Database.from(subQuery)
        .where('date', '>=', date15H5M.format(DATE_FORMAT))
        .where('date', '<', date15H.format(DATE_FORMAT))
    )
  }
}

module.exports = VisitService
