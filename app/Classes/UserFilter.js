const Filter = require('./Filter')
const { isEmpty } = require('lodash')

class UserFilter extends Filter {
  globalSearchFields = ['email', 'firstname', 'secondname']
  constructor(params, query) {
    super(params, query)
    if (isEmpty(params)) {
      return
    }
    this.processGlobals()
  }
}

module.exports = UserFilter
