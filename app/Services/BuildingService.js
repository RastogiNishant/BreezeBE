'use strict'

const Building = use('App/Models/Building')

class BuildingService {
  static async create({ user_id, data }) {
    return await Building.createItem({ ...data, user_id })
  }

  static async delete({ id, user_id }) {
    return await Building.query().where('id', id).where('user_id', user_id).delete()
  }

  static async get({ id, user_id }) {
    return await Building.query().where('id', id).where('user_id', user_id).first()
  }

  static async getAll(user_id) {
    return (await Building.query().where('user_id', user_id).fetch()).toJSON()
  }
}

module.exports = BuildingService
