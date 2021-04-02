const { pick, omit } = require('lodash')

const Model = use('Model')

class BaseModel extends Model {
  /**
   *
   */
  static async createItem(data) {
    return this.create(omit(pick(data, this.columns || []), ['id']))
  }

  /**
   *
   */
  async updateItem(data) {
    this.merge(omit(pick(data, this.constructor.columns || []), this.constructor.readonly || []))

    return this.save()
  }
}

module.exports = BaseModel
