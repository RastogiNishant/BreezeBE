'use strict'

const MAX_OPTIONS_COUNT = 12

const VanillaSerializer = require('@adonisjs/lucid/src/Lucid/Serializers/Vanilla')
const { merge, each, get } = require('lodash')
const moment = require('moment')
/**
 * Merge data
 */
class BaseSerializer extends VanillaSerializer {
  /**
   *
   */
  filterFields(item, extraFields = []) {
    const fields = [...(item.constructor.shortFieldsList || []), ...extraFields]
    each(get(item, '$attributes', {}), (v, k) => {
      if (!fields.includes(k)) {
        item.$attributes[k] = undefined
      }
    })
  }

  mergeData(item) {
    const json = this._getRowJSON(item)
    if (json.created_at) {
      json.created_at = moment.utc(json.created_at).format()
    }

    if (json.updated_at) {
      json.updated_at = moment.utc(json.updated_at).format()
    }

    return json
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

  toJSON(dataStr, ...args) {
    if (dataStr !== 'data') {
      args = [dataStr, ...args]
    }

    if (this.isOne) {
      return this.mergeData(this.rows, ...args)
    }

    const data = this.rows.map((i) => {
      return this.mergeData(i, ...args)
    })
    if (this.pages) {
      return merge({}, this.pages, { data })
    }
    return data
  }
}

module.exports = BaseSerializer
