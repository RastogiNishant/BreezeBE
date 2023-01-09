'use strict'

const { isString, isArray } = require('lodash')

const Model = require('./BaseModel')

class Room extends Model {
  static get columns() {
    return [
      'id',
      'estate_id',
      'type',
      'area',
      'status',
      'options',
      'name',
      'cover',
      'favorite',
      'order',
    ]
  }

  static get readonly() {
    return ['id', 'status', 'estate_id']
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
    })
  }

  /**
   *
   */
  estate() {
    return this.belongsTo('App/Models/Estate', 'estate_id', 'id')
  }

  images() {
    return this.hasMany('App/Models/Image').orderBy('order', 'asc')
  }

  room_amenities() {
    return this.hasMany('App/Models/Amenity', 'id', 'room_id').where('amenities.location', 'room')
  }
}

module.exports = Room
