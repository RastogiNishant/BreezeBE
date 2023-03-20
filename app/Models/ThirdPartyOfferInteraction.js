'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')

class ThirdPartyOfferInteraction extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'third_party_offer_id',
      'liked',
      'comment',
      'knocked',
      'inquiry',
      'created_at',
      'updated_at',
      'knocked_at',
    ]
  }
}

module.exports = ThirdPartyOfferInteraction
