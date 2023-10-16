'use srict'
const Base = require('./Base')
const yup = require('yup')

class CreateBuilding extends Base {
  static schema = () =>
    yup.object().shape({
      building_id: yup.string().min(1).max(255).required(),
      name: yup.string().min(1).max(255),
      street: yup.string().min(2).max(255),
      house_number: yup.string().min(1).max(255),
      zip: yup.string().max(8).required(),
      city: yup.string().min(1).max(255).required(),
      country: yup.string().min(1).max(255).required(),
      extra_address: yup.string().min(1).max(255)
    })
}

module.exports = CreateBuilding
