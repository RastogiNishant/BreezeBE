const Option = use('App/Models/Option')

const { remember } = require('../Libs/Cache')

class OptionService {
  /**
   *
   */
  static async getOptions() {
    return remember('apt_options', async () => Option.query().fetch(), null, ['cache', 'options'])
  }
}

module.exports = OptionService
