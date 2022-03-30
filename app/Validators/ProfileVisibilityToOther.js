const yup = require('yup')
const Base = require('./Base')
const {
  VISIBLE_TO_EVERYBODY,
  VISIBLE_TO_NOBODY,
  VISIBLE_TO_HOUSEHOLD,
  VISIBLE_TO_SPECIFIC
} = require('../constants')
class ProfileVisibilityToOther extends Base {
  static schema = () =>
    yup.object().shape({
      visibility_to_other: yup
        .number()
        .oneOf([
          VISIBLE_TO_EVERYBODY,
          VISIBLE_TO_HOUSEHOLD,
          VISIBLE_TO_NOBODY,
          VISIBLE_TO_SPECIFIC,
        ]),
    })
}

module.exports = ProfileVisibilityToOther
