'use strict'

const { pagination } = require('../Libs/schemas.js')
const Base = require('./Base')

class Pagination extends Base {
  static schema = () => pagination
}

module.exports = Pagination
