'use strict'

const Model = require('./BaseModel')

class LetterTemplate extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'company_id',
      'title',
      'body',
      'logo',
      'created_at',
      'updated_at',
      'status',
    ]
  }

  static get readonly() {
    return ['id']
  }

  static get Serializer() {
    return 'App/Serializers/LetterTemplateSerializer'
  }

  user() {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }

  company() {
    return this.belongsTo('App/Models/Company', 'company_id', 'id')
  }
}

module.exports = LetterTemplate
