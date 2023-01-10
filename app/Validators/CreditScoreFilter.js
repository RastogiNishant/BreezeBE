const Base = require('./Base')
const yup = require('yup')

class CreditScoreFilter extends Base {
  static schema = () =>
    yup.object().shape({
      credit_score_min: yup.number().positive().max(100),
      credit_score_max: yup.number().positive().max(100),
    })
}

module.exports = CreditScoreFilter
