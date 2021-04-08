'use strict'

const { isString, isArray } = require('lodash')

const Model = require('./BaseModel')

class Room extends Model {
  static get columns() {
    return ['id', 'estate_id', 'type', 'area', 'status', 'options', 'name', 'images', 'cover']
  }

  static get readonly() {
    return ['id', 'status', 'estate_id', 'images']
  }

  static get Serializer() {
    return 'App/Serializers/RoomSerializer'
  }

  static boot() {
    super.boot()
    // Processing options to one number
    this.addHook('beforeSave', async (instance) => {
      if (instance.dirty.options && !isString(instance.dirty.options)) {
        try {
          instance.options = isArray(instance.dirty.options)
            ? JSON.stringify(instance.dirty.options)
            : null
        } catch (e) {}
      }

      if (instance.dirty.images && !isString(instance.dirty.images)) {
        try {
          instance.images = isArray(instance.dirty.images)
            ? JSON.stringify(instance.dirty.images)
            : null
        } catch (e) {}
      }
    })
  }

  /**
   *
   */
  addImage(path) {
    this.images = [...(isArray(this.images) ? this.images : []), path]
  }

  /**
   *
   */
  removeImage(index) {
    if (!isArray(this.images) || this.images.length < index - 1) {
      return false
    }

    this.images = [
      ...this.images.slice(0, index),
      ...this.images.slice(index + 1, this.images.length),
    ]
  }

  /**
   *
   */
  estate() {
    return this.belongsTo('App/Models/Estate', 'estate_id', 'id')
  }
}

module.exports = Room
