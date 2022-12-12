'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  INVITATION_LINK_RETRIEVAL_CODE_CHARACTERS,
  INVITATION_LINK_RETRIEVAL_CODE_LENGTH,
} = require('../constants')
class InvitationLinkRetrieveCode extends Base {
  static schema = () =>
    yup.object().shape({
      code: yup
        .string()
        .matches(
          new RegExp(
            `[${INVITATION_LINK_RETRIEVAL_CODE_CHARACTERS}]{${INVITATION_LINK_RETRIEVAL_CODE_LENGTH}}`
          ),
          'Invalid Code Format.'
        ),
    })
}

module.exports = InvitationLinkRetrieveCode
