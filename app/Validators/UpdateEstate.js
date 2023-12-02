const yup = require('yup')
const CreateEstate = require('./CreateEstate')

const Base = require('./Base')

const { id } = require('../Libs/schemas')

class UpdateEstate extends Base {
  static schema = () =>
    yup
      .object()
      .shape({
        id: id.required(),
        delete_energy_proof: yup.boolean().default(false),
        active_visuals: yup.number().min(1).max(2)
      })
      .concat(CreateEstate.schema())
}

module.exports = UpdateEstate
