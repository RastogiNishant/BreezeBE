'use strict'

const Base = require('./Base')
const yup = require('yup')

class CreateUnitCategory extends Base {
  static schema = () =>
    yup.object().shape({
      building_id: yup.string().min(1).max(255).required(),
      name: yup.string().min(1).max(255).required(),
      property_id: yup.string().min(1).max(255).required(),
      rooms: yup.string().max(255).nullable(),
      area: yup.string().max(255).nullable(),
      rent: yup.string().max(255).nullable(),
      income_level: yup.string().max(255).nullable(),
      household_size: yup.string().max(255).nullable()
    })
}

module.exports = CreateUnitCategory
