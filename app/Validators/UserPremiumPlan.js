'use strict'

const yup = require('yup')

const Base = require('./Base')

class UserPremiumPlan extends Base {
  static schema = () =>
    yup.array().of(
      yup.object().shape({
        user_id: user_id.required(),
        premium_id: premium_id.required(),
      })
    )
}

module.exports = UserPremiumPlan
