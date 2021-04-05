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
  async updateItem(data, force = false) {
    const exclude = force ? [] : this.constructor.readonly || []
    this.merge(omit(pick(data, this.constructor.columns || []), exclude))

    return this.save()
  }
}

module.exports = BaseModel
