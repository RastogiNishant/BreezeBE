const yup = require('yup')
const { isArray } = require('lodash')
const Base = require('./Base')

class MatchFilter extends Base {
  static schema = () =>
    yup.object().shape({
      query: yup.string().min(2),
      percent: yup.array().of(yup.number()),
    })
}

module.exports = MatchFilter
