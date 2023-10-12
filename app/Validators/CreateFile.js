'use strict'

const Base = require('./Base')
const yup = require('yup')

class CreateFile extends Base {
  static schema = () => {
    return yup.object().shape({
      file: yup.mixed()
    })
  }
}

module.exports = CreateFile
