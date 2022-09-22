'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class LetterTemplate {
  static schema = () =>
    yup.object().shape({
      id: id,
      title: yup.string(),
      body: yup.string(),
      logo: yup.mixed(),
    })
}

module.exports = LetterTemplate
