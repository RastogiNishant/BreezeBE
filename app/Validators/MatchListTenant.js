'use strict'

const yup = require('yup')
const Base = require('./Base')

class MatchListTenant extends Base {
  static schema = () =>
    yup.object().shape({
      filters: yup.object().shape({
        like: yup.boolean(),
        dislike: yup.boolean(),
        buddy: yup.boolean(),
        knock: yup.boolean(),
        invite: yup.boolean(),
        share: yup.boolean(),
        top: yup.boolean(),
        commit: yup.boolean(),
      }),
    })
}

module.exports = MatchListTenant
