'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class LetterTemplate {
  static schema = () =>
    yup.object().shape({
      id: yup.number().positive().nullable(),
      company_address: yup.string().min(10).lowercase(),
      title: yup.string(),
      body: yup.string(),
      logo: yup.mixed(),
    })
}

module.exports = LetterTemplate
