'use strict'
const yup = require('yup')

class AddSeason {
  static schema = () =>
    yup.object().shape({
      parent_id: yup.number().positive().required(),
    })
}

module.exports = AddSeason
