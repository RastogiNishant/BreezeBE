const Base = require('./Base')
const yup = require('yup')

class BudgetFilter extends Base {
  static schema = () =>
    yup.object().shape({
      budget_min: yup.number().min(0).max(100),
      budget_max: yup.number().min(0).max(100),
    })
}

module.exports = BudgetFilter
