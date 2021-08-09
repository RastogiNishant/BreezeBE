const yup = require('yup')
const Base = require('./Base')

const { id } = require('../Libs/schemas')

class InviteUserToCome extends Base {
  static schema = () => {
    return yup.object().shape({
      estate_id: id.required(),
      user_id: id.required(),
    })
  }
}

module.exports = InviteUserToCome
