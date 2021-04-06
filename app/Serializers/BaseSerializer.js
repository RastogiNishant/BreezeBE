'use strict'

const VanillaSerializer = require('@adonisjs/lucid/src/Lucid/Serializers/Vanilla')
const { merge } = require('lodash')

/**
 * Merge data
 */
class BaseSerializer extends VanillaSerializer {
  mergeData(item) {
    return this._getRowJSON(item)
  }

  toJSON() {
    if (this.isOne) {
      return this.mergeData(this.rows)
    }

    const data = this.rows.map((i) => {
      return this.mergeData(i)
    })
    if (this.pages) {
      return merge({}, this.pages, { data })
    }
    return data
  }
}

module.exports = BaseSerializer
