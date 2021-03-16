'use strict'
const yup = require('yup')
const { get } = require('lodash')
const { ValidationException } = use('Validator')

const { PAGE_SIZE } = require('../../app/constants.js')
const { wrapValidationError } = require('../Libs/utils.js')

const schema = yup.object().shape({
  page: yup.number().positive().default(1),
  size: yup.number().positive().default(PAGE_SIZE),
  order: yup.mixed().default('id'),
})

class Pagination {
  async handle({ request }, next) {
    const result = await schema
      .validate(request.only(['page', 'size', 'order']), {
        abortEarly: false,
        stripUnknown: true,
      })
      .catch((e) => {
        throw wrapValidationError(e)
      })

    request.pagination = result

    await next()
  }
}

module.exports = Pagination
