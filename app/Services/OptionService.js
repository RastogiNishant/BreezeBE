const { without, isEmpty } = require('lodash')
const Promise = require('bluebird')

const Database = use('Database')
const Option = use('App/Models/Option')

const { remember } = require('../Libs/Cache')

class OptionService {
  /**
   *
   */
  static async getOptions() {
    return remember('apt_options', async () => Option.query().fetch(), null, ['cache', 'options'])
  }

  /**
   * Remove existing options if exists / add new options if not existing jet
   */
  static async updateEstateOptions(estate, optionsId) {
    const estateId = estate.id
    const existingOptionsId = (
      await Database.select('option_id').from('estate_option').where('estate_id', estateId)
    ).map((i) => i.option_id)
    const toCreate = without(optionsId, ...existingOptionsId)
    const toDelete = without(existingOptionsId, ...optionsId)

    if (!isEmpty(toCreate)) {
      await Database.into('estate_option').insert(
        toCreate.map((i) => ({ estate_id: estateId, option_id: i }))
      )
    }

    if (!isEmpty(toDelete)) {
      await Database.from('estate_option')
        .where('estate_id', estateId)
        .whereIn('option_id', toDelete)
        .del()
    }
  }
}

module.exports = OptionService
