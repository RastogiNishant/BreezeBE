const yup = require('yup')
const Base = require('./Base')

class ProfessionQuery extends Base {
  static schema = () =>
    yup.object().shape({
      query: yup.string().trim().min(2).required(),
    })
}

module.exports = ProfessionQuery
