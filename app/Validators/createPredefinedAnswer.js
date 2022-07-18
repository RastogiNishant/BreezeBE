'use Strict'
const { id } = require('../Libs/schemas.js')
const yup = require('yup')
const Base = require('./Base')

class createPredefinedAnswer extends Base{
  static schema = () =>
    yup.object().shape({
      task_id: id.required(),
      predefined_message_id: id.required(),
      predefined_message_choice_id: yup.number().positive(),
      text: yup.string(),
    })  
}

module.exports = createPredefinedAnswer
