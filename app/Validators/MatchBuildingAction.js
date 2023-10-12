'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base.js')

class MatchBuildingAction extends Base {
  static schema = () =>
    yup.object().shape({
      building_id: id.required(),
      user_id: id.required(),
      action: yup.string().oneOf(['like', 'dislike', 'knock']).required()
    })
}

module.exports = MatchBuildingAction
