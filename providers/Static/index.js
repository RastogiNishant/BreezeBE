'use strict'

const Promise = require('bluebird')
const { get } = require('lodash')

class Static {
  constructor(Database) {
    this.Database = Database
  }

  async init() {}
}

module.exports = Static
