'use strict'

const Database = use('Database')
const Model = require('./BaseModel')
const { isString, get } = require('lodash')

class Tenant extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'private_use',
      'pets',
      'pets_species',
      'parking_space',
      'coord',
      'dist_type',
      'dist_min',
      'budget_min',
      'budget_max',
      'include_utility',
      'rooms_min',
      'rooms_max',
      'floor_min',
      'floor_max',
      'space_min',
      'space_max',
      'apt_type',
      'house_type',
      'garden',
      'address',
      'income',
      'non_smoker',
      'options',
    ]
  }

  /**
   *
   */
  static get traits() {
    return ['NoTimestamp']
  }

  /**
   *
   */
  static get Serializer() {
    return 'App/Serializers/TenantSerializer'
  }

  /**
   *
   */
  static get readonly() {
    return ['id', 'user_id', 'income']
  }

  static boot() {
    super.boot()
    this.addTrait('@provider:SerializerExtender')
    this.addHook('beforeSave', async (instance) => {
      if (instance.dirty.coord && isString(instance.dirty.coord)) {
        const [lat, lon] = instance.dirty.coord.split(',')
        instance.coord = Database.gis.setSRID(Database.gis.point(lon, lat), 4326)
        instance.coord_raw = `${lat},${lon}`
        // TODO: hook for update zone
      }
    })
  }

  user() {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }

  /**
   *
   */
  point() {
    return this.hasOne('App/Models/Point', 'point_id', 'id')
  }

  /**
   *
   */
  getLatLon() {
    const toCoord = (str, reverse = true) => {
      let [lat, lon] = String(str || '').split(',')
      ;[lat, lon] = reverse
        ? [parseFloat(lon), parseFloat(lat)]
        : [parseFloat(lat), parseFloat(lon)]

      return { lat: lat || 0, lon: lon || 0 }
    }

    return toCoord(this.coord_raw, false)
  }
}

module.exports = Tenant
