const { pick, omit, isArray, each } = require('lodash')

const Model = use('Model')
const moment = require('moment')

class BaseModel extends Model {
  static boot() {
    super.boot()
    // Processing options to one number
    this.addHook('beforeSave', async (instance) => {
      const options = this.options || {}
      each(options, (v, k) => {
        if (instance.dirty[k]) {
          const values = instance.dirty[k]
          const data = (isArray(values) ? values : [values]).filter((i) => v.includes(i))
          let value = 0
          data.forEach((i) => {
            value = value | (1 << (i - 1))
          })
          instance[k] = value
        }
      })

      if (instance.updated_at) {
        instance.updated_at = moment.utc(new Date())
      }
    })
  }

  /**
   *
   */
  static async createItem(data, trx = null) {
    return this.create(omit(pick(data, this.columns || []), ['id']), trx)
  }

  /**
   *
   */
  async updateItem(data, force = false) {
    const exclude = force ? [] : this.constructor.readonly || []
    this.merge(omit(pick(data, this.constructor.columns || []), exclude))

    return this.save()
  }

  async updateItemWithTrx(data, trx, force = false) {
    const exclude = force ? [] : this.constructor.readonly || []
    this.merge(omit(pick(data, this.constructor.columns || []), exclude))

    return this.save(trx)
  }

  async deleteItem(id, trx) {
    if (trx) {
      return this.where('id', id).delete().transacting(trx)
    } else {
      return this.where('id', id).delete()
    }
  }

  getNumber(field) {
    return parseFloat(this[field]) || 0
  }
}

module.exports = BaseModel
