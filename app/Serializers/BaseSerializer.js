'use strict'

const MAX_OPTIONS_COUNT = 12

const VanillaSerializer = require('@adonisjs/lucid/src/Lucid/Serializers/Vanilla')
const { merge, each } = require('lodash')

/**
 * Merge data
 */
class BaseSerializer extends VanillaSerializer {
  mergeData(item) {
    return this._getRowJSON(item)
  }

  applyOptionsSerializer(item, options) {
    each(options, (v, k) => {
      let result = []
      if (!item[k]) {
        item[k] = result
      } else {
        for (let i = 0; i < MAX_OPTIONS_COUNT; i++) {
          if ((item[k] >> i) & 1) {
            result.push(i + 1)
          }
        }
      }

      item[k] = result
    })
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
